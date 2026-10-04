from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

# SQLite or PostgreSQL configuration
connect_args = {"check_same_thread": False, "timeout": 30.0} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.models_db import models
    Base.metadata.create_all(bind=engine)

    # Automatic migration helper for SQLite new columns
    if "sqlite" in settings.DATABASE_URL:
        with engine.connect() as conn:
            # Check existing columns in inspections table
            result = conn.execute(text("PRAGMA table_info(inspections)"))
            existing_cols = {row[1] for row in result.fetchall()}
            
            new_columns = [
                ("encoder_entry_position_mm", "FLOAT DEFAULT 0.0"),
                ("encoder_exit_position_mm", "FLOAT DEFAULT 6000.0"),
                ("conveyor_speed_mm_s", "FLOAT DEFAULT 1000.0"),
                ("coverage_top", "VARCHAR(32) DEFAULT 'INSPECTED'"),
                ("coverage_bottom", "VARCHAR(32) DEFAULT 'NOT_INSPECTED'"),
                ("coverage_left", "VARCHAR(32) DEFAULT 'INSPECTED'"),
                ("coverage_right", "VARCHAR(32) DEFAULT 'INSPECTED'"),
                ("coverage_front", "VARCHAR(32) DEFAULT 'INSPECTED'"),
                ("coverage_back", "VARCHAR(32) DEFAULT 'INSPECTED'"),
                ("why_failed_explanation", "TEXT"),
            ]
            for col_name, col_type in new_columns:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE inspections ADD COLUMN {col_name} {col_type}"))
            
            # Check defects table for encoder_pos_mm
            result_def = conn.execute(text("PRAGMA table_info(defects)"))
            existing_def_cols = {row[1] for row in result_def.fetchall()}
            if "encoder_pos_mm" not in existing_def_cols:
                conn.execute(text("ALTER TABLE defects ADD COLUMN encoder_pos_mm FLOAT DEFAULT 0.0"))
            
            conn.commit()
