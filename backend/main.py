import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.core.database import init_db, SessionLocal
from backend.core.events import manager
from backend.api.router import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("billet.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure directories, initialize database, seed initial sample data
    logger.info("Initializing Industrial Billet Inspection Platform backend...")
    settings.ensure_directories()
    init_db()
    
    # Pre-populate initial records if clean DB
    db = SessionLocal()
    try:
        from backend.models_db import models
        count = db.query(models.Inspection).count()
        if count == 0:
            logger.info("Seeding initial validated inspection records into database...")
            from backend.services.pipeline.orchestrator import pipeline_orchestrator
            # Seed 6 baseline billets with varied scenarios
            scenarios = [
                ("HEAT-26A-1042", "BATCH-104", "NORMAL", None, False),
                ("HEAT-26A-1042", "BATCH-104", "hairline_crack", None, False),
                ("HEAT-26A-1043", "BATCH-105", "longitudinal_crack", None, False),
                ("HEAT-26A-1043", "BATCH-105", "scab", None, False),
                ("HEAT-26A-1044", "BATCH-106", "NONE", 6245.0, False),
                ("HEAT-26A-1045", "BATCH-107", "NONE", None, True),
            ]
            for h, b, sc, sl, f_ocr in scenarios:
                await pipeline_orchestrator.execute_inspection(
                    db=db,
                    heat_number=h,
                    batch_id=b,
                    defect_scenario=None if sc == "NONE" else sc,
                    simulated_length=sl,
                    force_ocr_fail=f_ocr,
                )
    finally:
        db.close()
    
    yield
    logger.info("Shutting down Industrial Billet Inspection Platform...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack AI-powered industrial billet inspection, dimensional metrology, defect segmentation, OCR traceability, and cryptographically verified audit platform.",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount permanent storage directory for visual evidence and crops
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_PATH)), name="storage")

# Include REST Router
app.include_router(router)

# WebSocket Endpoints
@app.websocket("/ws/inspection")
async def websocket_inspection_endpoint(websocket: WebSocket):
    await manager.connect_inspection(websocket)
    try:
        while True:
            # Keep-alive receive
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_inspection(websocket)
    except Exception:
        manager.disconnect_inspection(websocket)

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect_alert(websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_alert(websocket)
    except Exception:
        manager.disconnect_alert(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
