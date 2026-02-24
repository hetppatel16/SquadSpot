# Database connection: engine, session factory, and table creation.
# Required: DATABASE_URL in environment (or .env). No server for SQLiteΓÇöjust the file path.
# Used by: repository (queries), seed script (create_tables + insert), and later the API.

import os
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.data_layer.models import Base

# Load .env so DATABASE_URL is set when running app or scripts from project root.
load_dotenv()

# Default URL if not set: SQLite file in current directory.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./squadspot.db")

# Engine: one per process; knows how to connect to the DB.
# check_same_thread=False allows the same connection from multiple threads (e.g. FastAPI).
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

# Session factory: call SessionLocal() to get a new session for a batch of queries.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_session():
    """
    Yield a DB session; closes it when the block exits (or on exception).
    Use: with get_session() as session: ... run queries ...
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_tables():
    """
    Create all tables (e.g. pois) if they do not exist.
    Call once at app startup or from the seed script before inserting data.
    """
    Base.metadata.create_all(bind=engine)
