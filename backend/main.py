import os
import time
import uuid
from typing import Optional

import jwt
import psycopg
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.auth.transport import requests as g_requests
from google.oauth2 import id_token
from psycopg.rows import dict_row
from pydantic import BaseModel

from exif_validator import validate_photo_freshness
from nlp_classifier import classify_issue

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ADMIN_INVITE_CODE = os.getenv("ADMIN_INVITE_CODE", "SARPRAS-POLINDRA-2026")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")
    if origin.strip()
]

app = FastAPI(title="ReportLoop API (PostGIS + Google Auth + EXIF + NLP)", version="0.3.0-semifinal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


class GoogleLogin(BaseModel):
    credential: str
    role: str
    nim: Optional[str] = None
    invite_code: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


def fail(status_code: int, code: str, message: str):
    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


def get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def decode_bearer_token(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        fail(401, "INVALID_SESSION", "Sesi login tidak valid atau sudah kedaluwarsa. Silakan masuk ulang.")


def get_optional_user(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    return decode_bearer_token(authorization)


def require_admin(authorization: Optional[str] = Header(default=None)) -> dict:
    payload = decode_bearer_token(authorization)
    if not payload:
        fail(401, "UNAUTHORIZED", "Autentikasi Admin Sarpras diperlukan.")
    if payload.get("role") != "admin":
        fail(403, "FORBIDDEN", "Akses ditolak. Hanya petugas Admin Sarpras yang dapat mengubah status laporan.")
    return payload


@app.get("/")
def health_check():
    return {"service": "ReportLoop API", "version": "0.3.0-semifinal", "status": "operational"}


@app.post("/api/auth/google")
def google_login(body: GoogleLogin):
    if body.role not in ("user", "admin"):
        fail(400, "BAD_ROLE", "Peran tidak valid.")

    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID.startswith("ISI_CLIENT_ID"):
        fail(500, "GOOGLE_NOT_CONFIGURED", "GOOGLE_CLIENT_ID belum diatur di file .env server.")

    try:
        info = id_token.verify_oauth2_token(
            body.credential,
            g_requests.Request(),
            GOOGLE_CLIENT_ID.strip(),
            clock_skew_in_seconds=60,
        )
    except ValueError as exc:
        fail(401, "BAD_TOKEN", f"Token Google ditolak: {exc}")

    if not info.get("email_verified"):
        fail(401, "EMAIL_UNVERIFIED", "Email Google belum terverifikasi.")

    email = info["email"].lower()
    name = info.get("name") or email.split("@")[0]

    with get_conn() as conn, conn.cursor() as cur:
        if body.role == "user":
            cur.execute("SELECT nim AS id, email, name FROM users WHERE email = %s;", (email,))
            account = cur.fetchone()
            if account is None:
                if not body.nim:
                    fail(422, "NIM_REQUIRED", "NIM diperlukan untuk pendaftaran akun mahasiswa baru.")
                nim_clean = body.nim.strip()
                if not (nim_clean.isdigit() and 6 <= len(nim_clean) <= 12):
                    fail(400, "BAD_NIM", "NIM harus berupa 6 sampai 12 digit angka.")
                cur.execute("SELECT 1 FROM users WHERE nim = %s;", (nim_clean,))
                if cur.fetchone():
                    fail(409, "NIM_TAKEN", "NIM ini sudah terdaftar pada akun lain.")
                cur.execute(
                    "INSERT INTO users (nim, email, name) VALUES (%s, %s, %s) RETURNING nim AS id, email, name;",
                    (nim_clean, email, name),
                )
                account = cur.fetchone()
                conn.commit()
        else:
            cur.execute("SELECT email AS id, email, name FROM admins WHERE email = %s;", (email,))
            account = cur.fetchone()
            if account is None:
                if not body.invite_code:
                    fail(422, "INVITE_REQUIRED", "Kode undangan Sarpras diperlukan untuk akun admin baru.")
                if body.invite_code.strip() != ADMIN_INVITE_CODE:
                    fail(400, "BAD_INVITE", "Kode undangan Sarpras tidak cocok.")
                cur.execute(
                    "INSERT INTO admins (email, name) VALUES (%s, %s) RETURNING email AS id, email, name;",
                    (email, name),
                )
                account = cur.fetchone()
                conn.commit()

    now = int(time.time())
    session_token = jwt.encode(
        {
            "sub": str(account["id"]),
            "email": account["email"],
            "name": account["name"],
            "role": body.role,
            "iat": now,
            "exp": now + 7 * 24 * 3600,
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    return {
        "id": str(account["id"]),
        "email": account["email"],
        "name": account["name"],
        "token": session_token,
    }


@app.get("/api/reports")
def list_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    reporter_id: Optional[str] = None,
    sort: Optional[str] = "upvotes",
    sort_by: Optional[str] = None,
):
    active_sort = sort_by or sort or "upvotes"
    conditions = []
    params = []

    if category and category != "All":
        conditions.append("category = %s")
        params.append(category)
    if status and status != "All":
        conditions.append("status = %s")
        params.append(status)
    if reporter_id:
        conditions.append("reporter_id = %s")
        params.append(reporter_id)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order_clause = "ORDER BY created_at DESC" if active_sort == "newest" else "ORDER BY upvotes DESC, created_at DESC"

    query = f"""
        SELECT
            id::text AS id,
            reporter_id,
            reporter_name,
            title,
            description,
            photo_url,
            photo_verification,
            ST_Y(location)::float AS latitude,
            ST_X(location)::float AS longitude,
            category,
            nlp_confidence::float AS nlp_confidence,
            status,
            upvotes,
            created_at
        FROM reports
        {where_clause}
        {order_clause};
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()


@app.post("/api/reports", status_code=201)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    force_submit: bool = Form(False),
    photo: UploadFile = File(...),
    user: Optional[dict] = Depends(get_optional_user),
):
    image_bytes = await photo.read()
    is_fresh, verification_label, captured_at, age_hours = validate_photo_freshness(image_bytes)
    if not is_fresh:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "STALE_PHOTO_REJECTED",
                "code": "STALE_PHOTO_REJECTED",
                "message": "Foto ditolak karena diambil lebih dari 24 jam yang lalu. Harap ambil foto kondisi terbaru.",
                "captured_at": captured_at,
                "age_hours": age_hours,
            },
        )

    predicted_cat, confidence = classify_issue(title, description)
    reporter_id = str(user["sub"]) if user else "2509015"
    reporter_name = str(user.get("name", "Mahasiswa Polindra")) if user else "Mahasiswa Polindra"

    with get_conn() as conn, conn.cursor() as cur:
        if not force_submit:
            cur.execute(
                """
                SELECT
                    id::text AS id,
                    title,
                    category,
                    upvotes,
                    ROUND(
                        ST_Distance(
                            location::geography,
                            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                        )::numeric,
                        1
                    )::float AS distance_meters
                FROM reports
                WHERE status != 'Resolved'
                  AND category = %s
                  AND ST_DWithin(
                      location::geography,
                      ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                      15.0
                  )
                ORDER BY distance_meters ASC
                LIMIT 1;
                """,
                (longitude, latitude, predicted_cat, longitude, latitude),
            )
            duplicate = cur.fetchone()
            if duplicate:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "DUPLICATE_NEARBY_REPORT",
                        "code": "DUPLICATE_NEARBY_REPORT",
                        "message": f"Laporan serupa sudah ada {float(duplicate['distance_meters'])} meter dari titik ini. Silakan tekan Upvote pada laporan tersebut.",
                        "existing_report": {
                            "id": str(duplicate["id"]),
                            "title": str(duplicate["title"]),
                            "category": str(duplicate["category"]),
                            "upvotes": int(duplicate["upvotes"]),
                            "distance_meters": float(duplicate["distance_meters"]),
                        },
                    },
                )

        ext = os.path.splitext(photo.filename or "upload.jpg")[1] or ".jpg"
        filename = f"{uuid.uuid4().hex[:10]}{ext}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        photo_url = f"/uploads/{filename}"
        cur.execute(
            """
            INSERT INTO reports (
                reporter_id, reporter_name, title, description,
                photo_url, photo_verification, location, category, nlp_confidence
            )
            VALUES (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s)
            RETURNING
                id::text AS id,
                reporter_id,
                reporter_name,
                title,
                description,
                photo_url,
                photo_verification,
                ST_Y(location)::float AS latitude,
                ST_X(location)::float AS longitude,
                category,
                nlp_confidence::float AS nlp_confidence,
                status,
                upvotes,
                created_at;
            """,
            (
                reporter_id,
                reporter_name,
                title,
                description,
                photo_url,
                verification_label,
                longitude,
                latitude,
                predicted_cat,
                confidence,
            ),
        )
        new_report = cur.fetchone()
        conn.commit()
        return new_report


@app.post("/api/reports/{report_id}/upvote")
def upvote_report(report_id: str, user: Optional[dict] = Depends(get_optional_user)):
    voter_id = str(user["sub"]) if user else "guest_tester"

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 FROM reports WHERE id = %s::uuid;", (report_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Report not found")

        cur.execute(
            "SELECT 1 FROM report_upvotes WHERE report_id = %s::uuid AND user_id = %s;",
            (report_id, voter_id),
        )
        if cur.fetchone():
            fail(409, "ALREADY_UPVOTED", "Anda sudah memberikan dukungan pada laporan ini.")

        cur.execute(
            "INSERT INTO report_upvotes (report_id, user_id) VALUES (%s::uuid, %s);",
            (report_id, voter_id),
        )
        cur.execute(
            """
            UPDATE reports
            SET upvotes = upvotes + 1
            WHERE id = %s::uuid
            RETURNING
                id::text AS id,
                reporter_id,
                reporter_name,
                title,
                description,
                photo_url,
                photo_verification,
                ST_Y(location)::float AS latitude,
                ST_X(location)::float AS longitude,
                category,
                nlp_confidence::float AS nlp_confidence,
                status,
                upvotes,
                created_at;
            """,
            (report_id,),
        )
        updated = cur.fetchone()
        conn.commit()
        return updated


@app.delete("/api/reports/{report_id}/upvote")
def remove_upvote(report_id: str, user: Optional[dict] = Depends(get_optional_user)):
    voter_id = str(user["sub"]) if user else "guest_tester"

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM report_upvotes WHERE report_id = %s::uuid AND user_id = %s RETURNING 1;",
            (report_id, voter_id),
        )
        deleted = cur.fetchone()
        if deleted:
            cur.execute(
                """
                UPDATE reports
                SET upvotes = GREATEST(1, upvotes - 1)
                WHERE id = %s::uuid
                RETURNING
                    id::text AS id,
                    reporter_id,
                    reporter_name,
                    title,
                    description,
                    photo_url,
                    photo_verification,
                    ST_Y(location)::float AS latitude,
                    ST_X(location)::float AS longitude,
                    category,
                    nlp_confidence::float AS nlp_confidence,
                    status,
                    upvotes,
                    created_at;
                """,
                (report_id,),
            )
        else:
            cur.execute(
                """
                SELECT
                    id::text AS id,
                    reporter_id,
                    reporter_name,
                    title,
                    description,
                    photo_url,
                    photo_verification,
                    ST_Y(location)::float AS latitude,
                    ST_X(location)::float AS longitude,
                    category,
                    nlp_confidence::float AS nlp_confidence,
                    status,
                    upvotes,
                    created_at
                FROM reports
                WHERE id = %s::uuid;
                """,
                (report_id,),
            )
        report = cur.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        conn.commit()
        return report


@app.patch("/api/reports/{report_id}/status")
def update_status(
    report_id: str,
    payload: StatusUpdate,
    admin: dict = Depends(require_admin),
):
    if payload.status not in ("Received", "In Progress", "Resolved"):
        fail(400, "INVALID_STATUS", "Status laporan tidak valid.")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reports
            SET status = %s,
                resolved_at = CASE WHEN %s = 'Resolved' THEN NOW() ELSE NULL END
            WHERE id = %s::uuid
            RETURNING
                id::text AS id,
                reporter_id,
                reporter_name,
                title,
                description,
                photo_url,
                photo_verification,
                ST_Y(location)::float AS latitude,
                ST_X(location)::float AS longitude,
                category,
                nlp_confidence::float AS nlp_confidence,
                status,
                upvotes,
                created_at;
            """,
            (payload.status, payload.status, report_id),
        )
        updated = cur.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Report not found")
        conn.commit()
        return updated


# === Serve Frontend Static Files untuk Akses 1-Link Tunnel ===
from pathlib import Path as _Path
from fastapi.staticfiles import StaticFiles as _StaticFiles
from fastapi.middleware.cors import CORSMiddleware as _CORSMiddleware

app.add_middleware(
    _CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_FE_DIR = _Path(__file__).resolve().parents[1] / "frontend"
if not _FE_DIR.exists():
    _FE_DIR = _Path(__file__).resolve().parents[2] / "frontend"
if _FE_DIR.exists():
    app.mount("/", _StaticFiles(directory=str(_FE_DIR), html=True), name="frontend")
