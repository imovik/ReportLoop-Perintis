from typing import Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

TRAINING_DATA = [
    ("Lampu lorong lantai 2 mati total", "Infrastructure"),
    ("Keran air kamar mandi bocor dan keran patah", "Infrastructure"),
    ("Stop kontak listrik konslet dan AC ruang kelas mati", "Infrastructure"),
    ("Atap plafon bocor dan proyektor rusak", "Infrastructure"),
    ("WiFi kampus putus nyambung dan kursi patah", "Infrastructure"),
    ("Bak sampah penuh meluap dan bau tidak sedap", "Cleanliness"),
    ("Toilet kotor bau pesing dan saluran air mampet", "Cleanliness"),
    ("Lantai koridor becek penuh lumpur dan sampah berserakan", "Cleanliness"),
    ("Gembok pagar parkir rusak dan pintu gerbang tidak terkunci", "Security"),
    ("Area parkir belakang gelap rawan pencurian helm", "Security"),
    ("CCTV lorong mati dan kaca jendela pos jaga pecah", "Security"),
]

texts = [item[0] for item in TRAINING_DATA]
labels = [item[1] for item in TRAINING_DATA]

model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("clf", MultinomialNB(alpha=0.5)),
])
model.fit(texts, labels)

def classify_issue(title: str, description: str) -> Tuple[str, float]:
    combined = f"{title} {description}".strip()
    pred = str(model.predict([combined])[0])
    probs = model.predict_proba([combined])[0]
    confidence = round(float(max(probs)), 4)
    return pred, confidence
