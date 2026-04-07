import os
from dotenv import load_dotenv

load_dotenv()

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234")
DATABASE_PATH = os.getenv("DATABASE_URL", "sqlite:///./completions.db").replace("sqlite:///./", "")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
