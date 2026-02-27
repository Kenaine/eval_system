import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from the backend directory regardless of where the server is started from
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Use service role key for backend

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
