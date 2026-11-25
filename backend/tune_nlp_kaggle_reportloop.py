import os
import glob
import json
import re
import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GridSearchCV, train_test_split

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
all_files = glob.glob(os.path.join(SCRIPT_DIR, "**", "*.*"), recursive=True)

slang_dict = {}
slang_files = [
    f for f in all_files
    if ("kamus" in os.path.basename(f).lower() or "slang" in os.path.basename(f).lower())
    and f.lower().endswith((".csv", ".txt", ".json"))
]
if slang_files:
    df_slang = pd.read_csv(slang_files[0])
    col_slang, col_baku = df_slang.columns[0], df_slang.columns[1]
    for _, row in df_slang.dropna(subset=[col_slang, col_baku]).iterrows():
        k = str(row[col_slang]).strip().lower()
        v = str(row[col_baku]).strip().lower()
        if k and v:
            slang_dict[k] = v

CAMPUS_TYPO_MAP = {
    "proyektr": "proyektor", "proyktor": "proyektor", "matot": "mati total",
    "mti": "mati", "gdung": "gedung", "kulia": "kuliah", "kulih": "kuliah",
    "bcor": "bocor", "netess": "netes", "wfi": "wifi", "wi-fi": "wifi",
    "kmpus": "kampus", "perpus": "perpustakaan", "nyambng": "nyambung",
    "bgt": "banget", "stopkntak": "stop kontak", "jringan": "jaringan",
    "konslt": "konslet", "lmpu": "lampu", "koridr": "koridor", "glp": "gelap",
    "monitr": "monitor", "kbl": "kabel", "rsk": "rusak", "pntu": "pintu",
    "kls": "kelas", "pth": "patah", "dsen": "dosen", "dngin": "dingin",
    "kntin": "kantin", "ilng": "hilang", "ilangg": "hilang", "pdhl": "padahal",
    "pnh": "penuh", "krsi": "kursi", "musola": "mushola", "knc": "kunci",
    "komptr": "komputer", "plfon": "plafon", "jbol": "jebol", "ujan": "hujan",
    "mct": "macet", "bnyk": "banyak", "lstrk": "listrik", "toilt": "toilet",
    "wc": "toilet", "cowo": "pria", "cwe": "wanita", "mmpet": "mampet",
    "lntai": "lantai", "tmpat": "tempat", "smpah": "sampah", "dpn": "depan",
    "ktr": "kotor", "bks": "bekas", "blm": "belum", "psing": "pesing",
    "wstafl": "wastafel", "got": "selokan", "slokan": "selokan", "sbn": "sabun",
    "kmr": "kamar", "mndi": "mandi", "prkiran": "parkiran", "mtr": "motor",
    "hlm": "helm", "stpam": "satpam", "grbang": "gerbang", "sarpras": "sarana prasarana",
    "lt": "lantai", "d": "di", "sm": "sama", "ga": "tidak", "gak": "tidak",
    "trs": "terus", "dr": "dari", "td": "tadi", "pgi": "pagi", "kmrn": "kemarin",
    "org": "orang", "yg": "yang", "jd": "jadi", "k": "ke", "tlg": "tolong", "bnerin": "benerin"
}
slang_dict.update(CAMPUS_TYPO_MAP)

def normalize_text(text: str) -> str:
    t = str(text).lower().strip()
    t = re.sub(r"([a-zA-Z])\1{2,}", r"\1", t)
    t = re.sub(r"(\w+)2\b", r"\1", t)
    tokens = re.findall(r"[a-z0-9\-]+|[^\w\s]", t)
    normalized = [slang_dict.get(tok, tok) for tok in tokens]
    return " ".join(normalized)

def load_any_table(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".parquet":
        return pd.read_parquet(path)
    if ext in (".xlsx", ".xls"):
        return pd.read_excel(path)
    if ext == ".json":
        return pd.read_json(path)
    try:
        return pd.read_csv(path)
    except Exception:
        return pd.read_csv(path, sep=None, engine="python")

target_names = ["indonesian_campus_complaints_44k", "train", "val"]
found_paths = [
    f for f in all_files
    if os.path.splitext(os.path.basename(f))[0].lower() in target_names
    and not f.lower().endswith((".py", ".docx", ".pdf", ".json", ".joblib"))
]

main_44k = [p for p in found_paths if "44k" in os.path.basename(p).lower()]
df = load_any_table(main_44k[0]) if main_44k else pd.concat([load_any_table(p) for p in found_paths], ignore_index=True)

text_candidates = [c for c in df.columns if any(k in c.lower() for k in ["text", "keluhan", "aspirasi", "pesan", "isi", "complaint", "content", "message"])]
text_col = text_candidates[0] if text_candidates else df.columns[0]

df = df.dropna(subset=[text_col]).copy()
df["clean_text"] = df[text_col].apply(normalize_text)

INFRA_PATTERN = re.compile(r"\b(proyektor|ac|wifi|internet|jaringan|lampu|listrik|stop kontak|kursi|meja|pintu|jendela|plafon|keran|kran|komputer|pc|sound|mic|lift|dispenser|kipas)\b")
CLEAN_PATTERN = re.compile(r"\b(toilet|kamar mandi|sampah|bau|pesing|kotor|mampet|tersumbat|debu|lumut|sabun|tisu|selokan|kebersihan|cleaning|lalat|tikus)\b")
SECUR_PATTERN = re.compile(r"\b(hilang|kehilangan|maling|dicuri|pencurian|cctv|satpam|keamanan|security|helm|dompet|mencurigakan|kebakaran|apar|gas bocor|pagar jebol|tawuran|berkelahi)\b")

def map_to_reportloop_label(clean_txt: str):
    has_sec = bool(SECUR_PATTERN.search(clean_txt))
    has_cln = bool(CLEAN_PATTERN.search(clean_txt))
    has_inf = bool(INFRA_PATTERN.search(clean_txt))
    if sum([has_sec, has_cln, has_inf]) != 1:
        return None
    if has_sec:
        return "Security"
    if has_cln:
        return "Cleanliness"
    return "Infrastructure"

df["label"] = df["clean_text"].apply(map_to_reportloop_label)
df_filtered = df.dropna(subset=["label"]).drop_duplicates(subset=["clean_text"]).copy()

print("Distribusi bersih (single-intent) dari dataset Kaggle:")
print(df_filtered["label"].value_counts())

SAMPLES_PER_CLASS = min(400, df_filtered["label"].value_counts().min())
df_balanced = (
    df_filtered.groupby("label", group_keys=False)
    .apply(lambda g: g.sample(n=SAMPLES_PER_CLASS, random_state=42))
    .reset_index(drop=True)
)
df_balanced[[text_col, "clean_text", "label"]].to_csv(os.path.join(SCRIPT_DIR, "kaggle_curated_campus_facilities.csv"), index=False)

X_train, X_test, y_train, y_test, raw_train, raw_test = train_test_split(
    df_balanced["clean_text"].tolist(),
    df_balanced["label"].tolist(),
    df_balanced[text_col].tolist(),
    test_size=0.30,
    random_state=42,
    stratify=df_balanced["label"].tolist(),
)

def keyword_baseline(raw_txt: str) -> str:
    t = str(raw_txt).lower()
    if any(k in t for k in ["hilang", "maling", "curi", "cctv", "satpam", "helm", "kebakaran"]):
        return "Security"
    if any(k in t for k in ["toilet", "wc", "sampah", "bau", "kotor", "mampet", "sabun", "selokan"]):
        return "Cleanliness"
    return "Infrastructure"

baseline_macro_f1 = f1_score(y_test, [keyword_baseline(t) for t in raw_test], average="macro")

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
embedder = SentenceTransformer(MODEL_NAME)
X_train_emb = embedder.encode(X_train, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
X_test_emb = embedder.encode(X_test, batch_size=64, show_progress_bar=True, normalize_embeddings=True)

grid = GridSearchCV(
    LogisticRegression(max_iter=1000, random_state=42),
    param_grid={"C": [0.5, 1.0, 2.0, 5.0, 10.0], "class_weight": [None, "balanced"], "solver": ["lbfgs"]},
    scoring="f1_macro",
    cv=5,
    n_jobs=-1
)
grid.fit(X_train_emb, y_train)
best_clf = grid.best_estimator_

y_pred = best_clf.predict(X_test_emb)
nlp_macro_f1 = f1_score(y_test, y_pred, average="macro")
labels = ["Infrastructure", "Cleanliness", "Security"]
cm = confusion_matrix(y_test, y_pred, labels=labels)

print("\n=== HASIL EVALUASI AKHIR (CLEAN SINGLE-INTENT KAGGLE + TYPO NORMALIZER) ===")
print(f"Total Data Latih : {len(X_train)} | Total Data Uji (30%): {len(X_test)}")
print(f"Baseline Keyword Macro-F1 (Teks Mentah) : {baseline_macro_f1:.4f}")
print(f"Tuned NLP Model Macro-F1                : {nlp_macro_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=labels, digits=4))
print("Confusion Matrix (rows=true, cols=pred [Infrastructure, Cleanliness, Security]):")
print(cm)

joblib.dump(
    {
        "classifier": best_clf,
        "model_name": MODEL_NAME,
        "threshold": 0.60,
        "typo_map": slang_dict,
        "best_params": grid.best_params_,
    },
    os.path.join(SCRIPT_DIR, "reportloop_nlp_kaggle_tuned.joblib"),
)

metrics_out = {
    "source_dataset": "Kaggle: Indonesian Campus Complaints & Aspirations (yogagustirachmadi)",
    "curated_total": len(df_balanced),
    "train_size": len(X_train),
    "test_size": len(X_test),
    "best_params": grid.best_params_,
    "baseline_macro_f1": round(float(baseline_macro_f1), 4),
    "nlp_macro_f1": round(float(nlp_macro_f1), 4),
    "labels": labels,
    "confusion_matrix": cm.tolist(),
    "confidence_threshold": 0.60,
}
with open(os.path.join(SCRIPT_DIR, "nlp_evaluation_kaggle_tuned.json"), "w", encoding="utf-8") as f:
    json.dump(metrics_out, f, indent=2)

def classify(text: str, threshold: float = 0.60):
    clean = normalize_text(text)
    emb = embedder.encode([clean], normalize_embeddings=True)
    proba = best_clf.predict_proba(emb)[0]
    best_idx = int(np.argmax(proba))
    label = str(best_clf.classes_[best_idx])
    confidence = float(proba[best_idx])
    return label, round(confidence, 4), confidence < threshold

print("\nUji Prediksi Kalimat Typo Mahasiswa:")
for sample in [
    "Sore min sarpras, ac d d102 mati dr kmrn tlg bgt d bnerin gerah bgt",
    "toilt cowo lt 2 mmpet airny meluap bau bgt",
    "hlm ilang d prkiran mtr blakang cctv mti",
    "tolong dicek ya min"
]:
    print(f"{sample!r} -> {classify(sample)}")