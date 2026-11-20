import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("smart_store.database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def get_engine():
    """
    Attempts to connect to MySQL database first.
    If MySQL server is unavailable or fails to connect,
    automatically falls back to SQLite so the app runs reliably.
    """
    db_url = settings.DATABASE_URL
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to MySQL database: %s", db_url.split('@')[-1] if '@' in db_url else db_url)
            return engine
    except Exception as e:
        if settings.USE_SQLITE_FALLBACK:
            logger.warning(
                "Could not connect to MySQL (%s). Falling back to SQLite: %s",
                str(e),
                settings.SQLITE_FALLBACK_URL
            )
            engine = create_engine(
                settings.SQLITE_FALLBACK_URL,
                connect_args={"check_same_thread": False},
                echo=False
            )
            return engine
        else:
            logger.error("Failed to connect to database: %s", str(e))
            raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the active database engine."""
    import app.models  # Ensure all models are imported before creating tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified and initialized.")
