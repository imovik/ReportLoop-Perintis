import os
import uuid
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg
from psycopg.rows import dict_row

from exif_validator import validate_photo_freshness
from nlp_classifier import classify_issue

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(title="ReportLoop API (PostGIS + EXIF + NLP)", version="0.2.0-semifinal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class StatusUpdate(BaseModel):
    status: str

def get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

@app.get("/")
def health_check():
    return {"service": "ReportLoop API", "status": "operational"}

@app.get("/api/reports")
def list_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
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

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order_clause = "ORDER BY created_at DESC" if active_sort == "newest" else "ORDER BY upvotes DESC, created_at DESC"

    query = f"""
        SELECT
            id::text AS id,
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
):
    image_bytes = await photo.read()
    is_fresh, verification_label, captured_at, age_hours = validate_photo_freshness(image_bytes)
    if not is_fresh:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "STALE_PHOTO_REJECTED",
                "message": "Foto ditolak karena diambil lebih dari 24 jam yang lalu. Harap ambil foto kondisi terbaru.",
                "captured_at": captured_at,
                "age_hours": age_hours,
            },
        )

    predicted_cat, confidence = classify_issue(title, description)

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
            INSERT INTO reports (title, description, photo_url, photo_verification, location, category, nlp_confidence)
            VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s)
            RETURNING
                id::text AS id,
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
            (title, description, photo_url, verification_label, longitude, latitude, predicted_cat, confidence),
        )
        new_report = cur.fetchone()
        conn.commit()
        return new_report

@app.post("/api/reports/{report_id}/upvote")
def upvote_report(report_id: str):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reports
            SET upvotes = upvotes + 1
            WHERE id = %s::uuid
            RETURNING
                id::text AS id,
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
        if not updated:
            raise HTTPException(status_code=404, detail="Report not found")
        conn.commit()
        return updated

@app.patch("/api/reports/{report_id}/status")
def update_status(report_id: str, payload: StatusUpdate):
    if payload.status not in ("Received", "In Progress", "Resolved"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reports
            SET status = %s,
                resolved_at = CASE WHEN %s = 'Resolved' THEN NOW() ELSE NULL END
            WHERE id = %s::uuid
            RETURNING
                id::text AS id,
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
