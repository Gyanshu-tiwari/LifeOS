import os
from dotenv import load_dotenv

load_dotenv(".env")

required = ["DATABASE_URL", "GEMINI_API_KEY", "GEMINI_MODEL", "GOOGLE_MAPS_API_KEY"]
missing = []
for r in required:
    val = os.getenv(r)
    if not val or "your_" in val or val == "":
        missing.append(r)

if missing:
    print(f"MISSING_OR_INVALID: {','.join(missing)}")
else:
    print("ALL_SECRETS_PRESENT")
