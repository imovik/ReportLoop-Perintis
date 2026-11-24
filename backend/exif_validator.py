from datetime import datetime, timezone, timedelta
from io import BytesIO
from typing import Tuple, Optional
from PIL import Image, ExifTags

WIB = timezone(timedelta(hours=7))

def validate_photo_freshness(image_bytes: bytes, max_age_hours: float = 24.0) -> Tuple[bool, str, Optional[str], Optional[float]]:
    try:
        img = Image.open(BytesIO(image_bytes))
        exif_raw = img.getexif()
        if not exif_raw:
            return True, "Unverified (No EXIF metadata)", None, None

        exif_data = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}
        dt_str = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
        if not dt_str:
            return True, "Unverified (No EXIF timestamp)", None, None

        captured_dt = datetime.strptime(str(dt_str), "%Y:%m:%d %H:%M:%S").replace(tzinfo=WIB)
        now_dt = datetime.now(WIB)
        age_hours = round((now_dt - captured_dt).total_seconds() / 3600.0, 1)

        if age_hours > max_age_hours:
            return False, "Stale photo rejected", captured_dt.isoformat(), age_hours

        return True, "Verified (Fresh camera photo)", captured_dt.isoformat(), age_hours
    except Exception:
        return True, "Unverified (EXIF parse fallback)", None, None
