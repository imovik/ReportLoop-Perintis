CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    photo_verification VARCHAR(80) NOT NULL DEFAULT 'Unverified (No EXIF metadata)',
    location GEOMETRY(Point, 4326) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('Infrastructure', 'Cleanliness', 'Security')),
    nlp_confidence NUMERIC(5, 4) DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'In Progress', 'Resolved')),
    upvotes INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_location ON reports USING GIST (location);
CREATE INDEX idx_reports_status_category ON reports (status, category);

INSERT INTO reports (title, description, photo_verification, location, category, nlp_confidence, status, upvotes)
VALUES
(
    'Lampu lorong lantai 2 padam',
    'Lampu penerangan koridor lantai 2 Gedung Kuliah Terpadu mati sejak kemarin malam.',
    'Verified (Fresh camera photo)',
    ST_SetSRID(ST_MakePoint(108.2815, -6.4085), 4326),
    'Infrastructure',
    0.9100,
    'In Progress',
    14
),
(
    'Bak sampah depan kantin penuh',
    'Sampah menumpuk meluap ke jalur pejalan kaki dan menimbulkan bau tidak sedap.',
    'Verified (Fresh camera photo)',
    ST_SetSRID(ST_MakePoint(108.2822, -6.4091), 4326),
    'Cleanliness',
    0.9400,
    'Received',
    9
),
(
    'Gembok pagar parkir motor rusak',
    'Gembok gerbang parkir barat macet dan tidak bisa dikunci saat sore hari.',
    'Verified (Fresh camera photo)',
    ST_SetSRID(ST_MakePoint(108.2809, -6.4079), 4326),
    'Security',
    0.8900,
    'Received',
    17
);
