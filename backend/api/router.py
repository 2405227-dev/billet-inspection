import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.core.config import settings
from backend.core.database import get_db
from backend.core.security import verify_audit_chain, calculate_audit_hash
from backend.models_db import models, schemas
from backend.services.camera.provider import camera_manager
from backend.services.decision.decision_engine import decision_engine
from backend.services.pipeline.orchestrator import pipeline_orchestrator
from backend.services.simulator.production_simulator import simulator_service
from backend.services.exports.excel_exporter import export_audit_excel
from backend.services.exports.csv_exporter import export_inspections_csv, export_defects_csv
from backend.services.exports.pdf_exporter import generate_individual_billet_pdf, generate_batch_audit_pdf

router = APIRouter()

# ----------------------------------------------------
# Health & Status
# ----------------------------------------------------
@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "database": "CONNECTED",
        "cameras_online": len(camera_manager.cameras),
    }

# ----------------------------------------------------
# Inspection Endpoints
# ----------------------------------------------------
@router.get("/api/inspections", response_model=List[schemas.InspectionSummary], tags=["Inspections"])
def list_inspections(
    search: Optional[str] = None,
    status: Optional[str] = None,
    heat_number: Optional[str] = None,
    batch_id: Optional[str] = None,
    defect_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Inspection)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Inspection.id.ilike(s_term),
                models.Inspection.billet_id.ilike(s_term),
                models.Inspection.heat_number.ilike(s_term),
                models.Inspection.batch_id.ilike(s_term),
                models.Inspection.ocr_text.ilike(s_term),
            )
        )

    if status and status != "ALL":
        query = query.filter(models.Inspection.status == status.upper())

    if heat_number:
        query = query.filter(models.Inspection.heat_number.ilike(f"%{heat_number}%"))

    if batch_id:
        query = query.filter(models.Inspection.batch_id.ilike(f"%{batch_id}%"))

    if defect_type and defect_type != "ALL":
        query = query.join(models.Defect).filter(models.Defect.defect_type.ilike(f"%{defect_type}%"))

    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date)
            query = query.filter(models.Inspection.timestamp >= dt_start)
        except ValueError:
            pass

    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date)
            query = query.filter(models.Inspection.timestamp <= dt_end)
        except ValueError:
            pass

    records = query.order_by(desc(models.Inspection.timestamp)).offset(offset).limit(limit).all()
    return records

@router.get("/api/inspections/{inspection_id}", response_model=schemas.InspectionDetail, tags=["Inspections"])
def get_inspection_detail(inspection_id: str, db: Session = Depends(get_db)):
    rec = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found.")
    return rec

@router.post("/api/inspections/trigger", tags=["Inspections"])
async def trigger_single_inspection(
    billet_id: Optional[str] = None,
    heat_number: Optional[str] = None,
    batch_id: Optional[str] = None,
    scenario: Optional[str] = "NORMAL",
    simulated_length: Optional[float] = None,
    force_ocr_fail: bool = False,
    db: Session = Depends(get_db),
):
    """Manually triggers a full pass through the inspection pipeline."""
    result = await pipeline_orchestrator.execute_inspection(
        db=db,
        billet_id=billet_id,
        heat_number=heat_number,
        batch_id=batch_id,
        defect_scenario=None if scenario == "NORMAL" else scenario,
        simulated_length=simulated_length,
        force_ocr_fail=force_ocr_fail,
    )
    return {"status": "SUCCESS", "inspection": result}

# ----------------------------------------------------
# Human-in-the-Loop Review
# ----------------------------------------------------
@router.post("/api/review/{inspection_id}", tags=["Review"])
def operator_review_override(
    inspection_id: str,
    payload: schemas.OperatorReviewRequest,
    db: Session = Depends(get_db),
):
    rec = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    old_status = rec.status
    rec.operator_override = True
    rec.operator_id = payload.operator_id
    rec.operator_decision = payload.decision
    rec.operator_comment = payload.comment
    rec.review_status = "REVIEWED"
    rec.status = payload.decision.upper()
    rec.decision_reason = f"Operator Override by {payload.operator_id}: {payload.comment} (Original AI: {old_status})"
    
    if payload.corrected_ocr_heat:
        rec.heat_number = payload.corrected_ocr_heat

    # Log Audit Event for Operator Modification
    audit_evt = models.AuditEvent(
        inspection_id=inspection_id,
        action="OPERATOR_OVERRIDE",
        actor_id=payload.operator_id,
        details={
            "old_status": old_status,
            "new_status": rec.status,
            "comment": payload.comment,
        },
        audit_hash_snapshot=rec.audit_hash,
        timestamp=datetime.utcnow(),
    )
    db.add(audit_evt)
    db.commit()
    db.refresh(rec)

    return {"status": "SUCCESS", "inspection": rec}

# ----------------------------------------------------
# Audit Chain Verification & Anti-Tamper
# ----------------------------------------------------
@router.get("/api/audit/verify", response_model=schemas.AuditVerifyResponse, tags=["Audit"])
def verify_audit_trail(db: Session = Depends(get_db)):
    """Verifies complete SHA-256 cryptographic chaining across all inspection records."""
    records = db.query(models.Inspection).order_by(models.Inspection.created_at.asc()).all()
    records_dict = [
        {
            "inspection_id": r.id,
            "billet_id": r.billet_id,
            "heat_number": r.heat_number,
            "batch_id": r.batch_id,
            "timestamp": r.timestamp,
            "status": r.status,
            "length_mm": r.length_mm,
            "width_mm": r.width_mm,
            "height_mm": r.height_mm,
            "defect_count": r.defect_count,
            "ocr_text": r.ocr_text,
            "decision_reason": r.decision_reason,
            "model_version": r.model_version,
            "calibration_version": r.calibration_version,
            "audit_hash": r.audit_hash,
            "previous_audit_hash": r.previous_audit_hash,
        }
        for r in records
    ]
    is_valid, count_or_fail_idx, msg = verify_audit_chain(records_dict)
    return {
        "is_valid": is_valid,
        "total_records": len(records),
        "failing_record_index": None if is_valid else count_or_fail_idx,
        "message": msg,
        "verified_at": datetime.utcnow(),
    }

@router.post("/api/audit/tamper-test", tags=["Audit"])
def simulate_database_tamper(db: Session = Depends(get_db)):
    """
    DEMO / TESTING ENDPOINT:
    Simulates malicious direct database manipulation on a historical record
    to demonstrate instant detection by the SHA-256 audit verification engine.
    """
    last_rec = db.query(models.Inspection).order_by(models.Inspection.created_at.desc()).first()
    if not last_rec:
        raise HTTPException(status_code=400, detail="No inspection records to tamper with.")
    
    # Intentionally manipulate status without recalculating hash
    last_rec.decision_reason = "TAMPERED_RECORD_DATA_VIOLATION"
    db.commit()
    return {
        "status": "TAMPER_SIMULATED",
        "message": f"Modified record {last_rec.id} data without updating hash. Run /api/audit/verify to detect tamper!",
    }

# ----------------------------------------------------
# Reports & Exports
# ----------------------------------------------------
@router.get("/api/inspections/{inspection_id}/report", tags=["Reports"])
def download_individual_pdf_report(inspection_id: str, db: Session = Depends(get_db)):
    rec = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    # Convert to dictionary with relationships
    rec_dict = {
        "id": rec.id,
        "billet_id": rec.billet_id,
        "heat_number": rec.heat_number,
        "batch_id": rec.batch_id,
        "timestamp": rec.timestamp,
        "status": rec.status,
        "decision_reason": rec.decision_reason,
        "length_mm": rec.length_mm,
        "width_mm": rec.width_mm,
        "height_mm": rec.height_mm,
        "defect_count": rec.defect_count,
        "ocr_text": rec.ocr_text,
        "ocr_confidence": rec.ocr_confidence,
        "barcode_value": rec.barcode_value,
        "barcode_type": rec.barcode_type,
        "model_version": rec.model_version,
        "calibration_version": rec.calibration_version,
        "processing_latency_ms": rec.processing_latency_ms,
        "audit_hash": rec.audit_hash,
        "previous_audit_hash": rec.previous_audit_hash,
        "dimensions": [
            {
                "dimension_name": d.dimension_name,
                "measured_value_mm": d.measured_value_mm,
                "nominal_mm": d.nominal_mm,
                "expected_min_mm": d.expected_min_mm,
                "expected_max_mm": d.expected_max_mm,
                "deviation_pct": d.deviation_pct,
                "status": d.status,
            }
            for d in rec.dimensions
        ],
        "defects": [
            {
                "id": d.id,
                "defect_type": d.defect_type,
                "severity": d.severity,
                "confidence": d.confidence,
                "length_mm": d.length_mm,
                "width_mm": d.width_mm,
                "area_mm2": d.area_mm2,
                "surface_face": d.surface_face,
            }
            for d in rec.defects
        ],
    }

    pdf_filename = f"Inspection_Report_{inspection_id}.pdf"
    pdf_path = settings.REPORTS_PATH / pdf_filename
    generate_individual_billet_pdf(rec_dict, pdf_path)

    return FileResponse(
        path=str(pdf_path),
        filename=pdf_filename,
        media_type="application/pdf",
    )

@router.get("/api/export/excel", tags=["Reports"])
def download_excel_export(
    heat_number: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Inspection)
    if heat_number:
        query = query.filter(models.Inspection.heat_number.ilike(f"%{heat_number}%"))
    if status and status != "ALL":
        query = query.filter(models.Inspection.status == status.upper())

    records = query.order_by(models.Inspection.timestamp.asc()).all()
    records_dict = []
    for r in records:
        r_d = {
            "id": r.id,
            "billet_id": r.billet_id,
            "heat_number": r.heat_number,
            "batch_id": r.batch_id,
            "timestamp": r.timestamp,
            "status": r.status,
            "decision_reason": r.decision_reason,
            "length_mm": r.length_mm,
            "width_mm": r.width_mm,
            "height_mm": r.height_mm,
            "dimension_status": r.dimension_status,
            "ocr_text": r.ocr_text,
            "ocr_confidence": r.ocr_confidence,
            "defect_count": r.defect_count,
            "processing_latency_ms": r.processing_latency_ms,
            "camera_ids": r.camera_ids,
            "model_version": r.model_version,
            "calibration_version": r.calibration_version,
            "audit_hash": r.audit_hash,
            "defects": [
                {
                    "id": d.id,
                    "defect_type": d.defect_type,
                    "severity": d.severity,
                    "confidence": d.confidence,
                    "surface_face": d.surface_face,
                    "length_mm": d.length_mm,
                    "width_mm": d.width_mm,
                    "area_mm2": d.area_mm2,
                    "orientation_deg": d.orientation_deg,
                    "crop_path": d.crop_path,
                }
                for d in r.defects
            ],
        }
        records_dict.append(r_d)

    excel_filename = "billet_inspection_audit.xlsx"
    excel_path = settings.EXPORTS_PATH / excel_filename
    export_audit_excel(records_dict, excel_path)

    return FileResponse(
        path=str(excel_path),
        filename=excel_filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

@router.get("/api/export/csv", tags=["Reports"])
def download_csv_export(export_type: str = "inspections", db: Session = Depends(get_db)):
    records = db.query(models.Inspection).order_by(models.Inspection.timestamp.asc()).all()
    records_dict = [
        {
            "id": r.id,
            "billet_id": r.billet_id,
            "heat_number": r.heat_number,
            "batch_id": r.batch_id,
            "timestamp": r.timestamp,
            "length_mm": r.length_mm,
            "width_mm": r.width_mm,
            "height_mm": r.height_mm,
            "dimension_status": r.dimension_status,
            "ocr_text": r.ocr_text,
            "ocr_confidence": r.ocr_confidence,
            "defect_count": r.defect_count,
            "status": r.status,
            "decision_reason": r.decision_reason,
            "processing_latency_ms": r.processing_latency_ms,
            "model_version": r.model_version,
            "calibration_version": r.calibration_version,
            "audit_hash": r.audit_hash,
            "previous_audit_hash": r.previous_audit_hash,
            "defects": [
                {
                    "id": d.id,
                    "defect_type": d.defect_type,
                    "severity": d.severity,
                    "confidence": d.confidence,
                    "surface_face": d.surface_face,
                    "length_mm": d.length_mm,
                    "width_mm": d.width_mm,
                    "area_mm2": d.area_mm2,
                    "orientation_deg": d.orientation_deg,
                    "crop_path": d.crop_path,
                }
                for d in r.defects
            ],
        }
        for r in records
    ]

    if export_type == "defects":
        csv_filename = "defect_details.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_defects_csv(records_dict, csv_path)
    else:
        csv_filename = "inspection_audit.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_inspections_csv(records_dict, csv_path)

    return FileResponse(
        path=str(csv_path),
        filename=csv_filename,
        media_type="text/csv",
    )

@router.get("/api/export/pdf", tags=["Reports"])
def download_batch_pdf_report(db: Session = Depends(get_db)):
    records = db.query(models.Inspection).order_by(models.Inspection.timestamp.asc()).all()
    records_dict = [
        {
            "id": r.id,
            "billet_id": r.billet_id,
            "heat_number": r.heat_number,
            "batch_id": r.batch_id,
            "timestamp": r.timestamp,
            "length_mm": r.length_mm,
            "width_mm": r.width_mm,
            "height_mm": r.height_mm,
            "defect_count": r.defect_count,
            "ocr_confidence": r.ocr_confidence,
            "status": r.status,
            "audit_hash": r.audit_hash,
        }
        for r in records
    ]
    pdf_filename = "billet_inspection_audit_report.pdf"
    pdf_path = settings.REPORTS_PATH / pdf_filename
    generate_batch_audit_pdf(records_dict, pdf_path)

    return FileResponse(
        path=str(pdf_path),
        filename=pdf_filename,
        media_type="application/pdf",
    )

# ----------------------------------------------------
# Alerts
# ----------------------------------------------------
@router.get("/api/alerts", response_model=List[schemas.AlertResponse], tags=["Alerts"])
def get_recent_alerts(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(desc(models.Alert.timestamp)).limit(limit).all()

@router.post("/api/alerts/{alert_id}/ack", tags=["Alerts"])
def acknowledge_alert(alert_id: str, operator_id: str = "OP-104", db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_acknowledged = True
    alert.acknowledged_by = operator_id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"status": "SUCCESS", "alert": alert}

# ----------------------------------------------------
# KPI & Analytics Overview
# ----------------------------------------------------
@router.get("/api/stats/overview", response_model=schemas.StatsOverviewResponse, tags=["Analytics"])
def get_stats_overview(db: Session = Depends(get_db)):
    inspections = db.query(models.Inspection).all()
    total = len(inspections)
    pass_cnt = sum(1 for i in inspections if i.status == "PASS")
    fail_cnt = sum(1 for i in inspections if i.status == "FAIL")
    rework_cnt = sum(1 for i in inspections if i.status == "REWORK")
    review_cnt = sum(1 for i in inspections if i.status == "NEEDS_REVIEW")
    
    pass_rate = round((pass_cnt / max(total, 1)) * 100, 1)
    active_alerts = db.query(models.Alert).filter(models.Alert.is_acknowledged == False).count()
    avg_latency = round(sum(i.processing_latency_ms for i in inspections) / max(total, 1), 1)
    ocr_success_cnt = sum(1 for i in inspections if (i.ocr_confidence or 0) >= 0.80)
    ocr_rate = round((ocr_success_cnt / max(total, 1)) * 100, 1)

    # Defect breakdowns
    defects = db.query(models.Defect).all()
    breakdown = {}
    for d in defects:
        dt = d.defect_type
        breakdown[dt] = breakdown.get(dt, 0) + 1

    # Trend (last 10 inspections)
    recent = db.query(models.Inspection).order_by(models.Inspection.timestamp.desc()).limit(15).all()
    trend = [
        {
            "id": r.id,
            "timestamp": str(r.timestamp)[11:19],
            "status": r.status,
            "latency_ms": r.processing_latency_ms,
            "defect_count": r.defect_count,
        }
        for r in reversed(recent)
    ]

    return {
        "total_inspections": total,
        "pass_count": pass_cnt,
        "fail_count": fail_cnt,
        "rework_count": rework_cnt,
        "review_count": review_cnt,
        "pass_rate_pct": pass_rate,
        "active_alerts_count": active_alerts,
        "avg_latency_ms": avg_latency,
        "ocr_success_rate_pct": ocr_rate,
        "total_defects_detected": len(defects),
        "defect_type_breakdown": breakdown,
        "status_trend": trend,
    }

# ----------------------------------------------------
# Simulator Controls
# ----------------------------------------------------
@router.post("/api/simulator/start", tags=["Simulator"])
def start_simulator(interval_sec: float = 4.0):
    simulator_service.start(interval_sec=interval_sec)
    return {"status": "SUCCESS", "simulator": simulator_service.get_status()}

@router.post("/api/simulator/stop", tags=["Simulator"])
def stop_simulator():
    simulator_service.stop()
    return {"status": "SUCCESS", "simulator": simulator_service.get_status()}

@router.get("/api/simulator/status", tags=["Simulator"])
def get_simulator_status():
    return simulator_service.get_status()

@router.post("/api/simulator/step", tags=["Simulator"])
async def step_simulator(scenario: Optional[str] = None):
    res = await simulator_service.step_one_billet(forced_scenario=scenario)
    return res

# ----------------------------------------------------
# Camera & Hardware Controls
# ----------------------------------------------------
@router.get("/api/cameras", tags=["Hardware"])
def get_camera_statuses():
    return camera_manager.get_camera_status()

@router.get("/api/settings", tags=["Configuration"])
def get_system_settings():
    return {
        "plant": settings.plant_config,
        "cameras": settings.camera_config,
        "tolerances": settings.tolerances_config,
        "models": settings.models_config,
        "alerts": settings.alerts_config,
    }
