from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use local postgres as default if env is missing
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+pg8000://shiva@localhost:5432/campuseats")

# Connection pool configuration for production stability
# Optimized for load testing: supports up to 50 concurrent connections
# pool_size=20: Base connections always open (conservative)
# max_overflow=30: Additional connections when needed (total max=50)
# pool_pre_ping=True: Health check before using connection (prevents stale connection 503s)
# pool_timeout=10: Fail fast if pool exhausted
# pool_recycle=3600: Recycle connections after 1 hour (prevents stale connections)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=10,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
