import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

import base64
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Body
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
from backend.services.exports.csv_exporter import (
    export_inspections_csv, export_defects_csv, export_eca_csv,
    export_paut_csv, export_measurements_csv, export_audit_csv
)
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

@router.post("/api/inspections/inspect-frame", tags=["Inspections"])
async def inspect_uploaded_or_video_frame(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    Real-Time Live Video Inspection Endpoint:
    Accepts base64 encoded frame captured from the Optical Rig video player on the conveyor belt,
    executes neural surface crack segmentation, dimensional metrology, and OCR,
    and logs a permanent SHA-256 cryptographically audited inspection entity.
    """
    frame_b64 = payload.get("frame_base64")
    billet_id = payload.get("billet_id")
    heat_number = payload.get("heat_number", "26A-1042")
    batch_id = payload.get("batch_id", "BATCH-01")
    scenario = payload.get("scenario", "NORMAL")
    camera_id = payload.get("camera_id", "CAM-01")

    decoded_img = None
    if frame_b64:
        if "," in frame_b64:
            frame_b64 = frame_b64.split(",", 1)[1]
        try:
            img_bytes = base64.b64decode(frame_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            decoded_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 frame data: {str(e)}")

    result = await pipeline_orchestrator.execute_inspection(
        db=db,
        billet_id=billet_id,
        heat_number=heat_number,
        batch_id=batch_id,
        defect_scenario=None if scenario == "NORMAL" else scenario,
        raw_frame_image=decoded_img,
        camera_id=camera_id,
    )
    return {"status": "SUCCESS", "inspection": result}

# ----------------------------------------------------
# Defects Catalog Endpoint
# ----------------------------------------------------
@router.get("/api/defects", tags=["Defects"])
def list_defects(
    severity: Optional[str] = None,
    defect_type: Optional[str] = None,
    surface_face: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Defect).join(models.Inspection)

    if severity and severity != "ALL":
        query = query.filter(models.Defect.severity == severity.upper())

    if defect_type and defect_type != "ALL":
        query = query.filter(models.Defect.defect_type.ilike(f"%{defect_type}%"))

    if surface_face and surface_face != "ALL":
        query = query.filter(models.Defect.surface_face == surface_face.upper())

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Defect.id.ilike(s_term),
                models.Defect.defect_type.ilike(s_term),
                models.Defect.inspection_id.ilike(s_term),
                models.Inspection.billet_id.ilike(s_term),
                models.Inspection.heat_number.ilike(s_term),
            )
        )

    total_count = query.count()
    records = query.order_by(desc(models.Defect.inspection_id)).offset(offset).limit(limit).all()

    # Calculate severity breakdown
    all_defects = db.query(models.Defect).all()
    sev_counts = {"CRITICAL": 0, "MAJOR": 0, "MODERATE": 0, "MINOR": 0}
    type_counts = {}
    for d in all_defects:
        s = d.severity.upper() if d.severity else "MINOR"
        sev_counts[s] = sev_counts.get(s, 0) + 1
        t = d.defect_type
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "total_count": total_count,
        "severity_breakdown": sev_counts,
        "type_breakdown": type_counts,
        "defects": [
            {
                "id": d.id,
                "inspection_id": d.inspection_id,
                "billet_id": d.inspection.billet_id if d.inspection else "UNKNOWN",
                "heat_number": d.inspection.heat_number if d.inspection else "UNKNOWN",
                "defect_type": d.defect_type,
                "severity": d.severity,
                "confidence": d.confidence,
                "camera_id": d.camera_id,
                "surface_face": d.surface_face,
                "x_pos_px": d.x_pos_px,
                "y_pos_px": d.y_pos_px,
                "encoder_pos_mm": d.encoder_pos_mm,
                "bbox_xywh": d.bbox_xywh,
                "length_mm": d.length_mm,
                "width_mm": d.width_mm,
                "area_mm2": d.area_mm2,
                "orientation_deg": d.orientation_deg,
                "crop_path": d.crop_path,
                "timestamp": d.inspection.timestamp.isoformat() if d.inspection and d.inspection.timestamp else None,
            }
            for d in records
        ],
    }

@router.post("/api/video/upload", tags=["Video"])
async def upload_conveyor_video(payload: Dict[str, Any] = Body(...)):
    """Upload custom conveyor belt inspection video (.mp4, .webm, .mov) via base64."""
    filename = payload.get("filename", "conveyor.mp4")
    video_b64 = payload.get("video_base64", "")
    
    upload_dir = settings.BASE_DIR / "storage" / "raw-frames"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    ext = Path(filename).suffix.lower() or ".mp4"
    file_id = f"video_{int(time.time()*1000)}{ext}"
    target_path = upload_dir / file_id

    if video_b64:
        if "," in video_b64:
            video_b64 = video_b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(video_b64)
        with open(target_path, "wb") as f:
            f.write(raw_bytes)

    return {
        "status": "SUCCESS",
        "filename": filename,
        "video_url": f"/storage/raw-frames/{file_id}",
    }

@router.get("/api/video/demo", tags=["Video"])
def get_demo_videos():
    """List available demo conveyor video streams."""
    return {
        "demo_videos": [
            {
                "id": "conveyor-line-01",
                "title": "Continuous Billet Cooling Bed & Conveyor Line 01 (Factory 4K)",
                "url": "/demo/factory-conveyor.mp4",
                "description": "Live hot steel billet transport past optical inspection rig with laser triangulation.",
                "duration_sec": 12.5,
                "fps": 60,
                "resolution": "3840x2160 (4K UHD)",
            }
        ]
    }

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
def _serialize_inspection_for_export(rec: models.Inspection) -> Dict[str, Any]:
    b_len = rec.length_mm or 6000.0
    
    # Dimensions
    dim_items = [
        {
            "dimension_name": d.dimension_name,
            "measured_value_mm": d.measured_value_mm,
            "nominal_mm": d.nominal_mm,
            "expected_min_mm": d.expected_min_mm,
            "expected_max_mm": d.expected_max_mm,
            "deviation_pct": d.deviation_pct,
            "status": d.status,
            "camera_id": d.camera_id,
        }
        for d in rec.dimensions
    ] if rec.dimensions else []

    # Defects with physical positions
    defects_items = []
    for d in rec.defects:
        pos_f = d.encoder_pos_mm or 0.0
        defects_items.append({
            "id": d.id,
            "defect_type": d.defect_type,
            "severity": d.severity,
            "confidence": d.confidence,
            "surface_face": d.surface_face or "TOP",
            "position_from_front_mm": pos_f,
            "position_from_back_mm": max(0.0, b_len - pos_f),
            "encoder_pos_mm": pos_f,
            "x_pos_px": d.x_pos_px or 0,
            "y_pos_px": d.y_pos_px or 0,
            "length_mm": d.length_mm or 0.0,
            "width_mm": d.width_mm or 0.0,
            "area_mm2": d.area_mm2 or 0.0,
            "orientation_deg": d.orientation_deg or 0.0,
            "crop_path": d.crop_path or "N/A",
        })

    # ECA Indications
    eca_items = []
    if rec.eca_indications:
        for e in rec.eca_indications:
            pos_f = e.encoder_position_mm or 0.0
            eca_items.append({
                "channel_idx": e.channel_idx,
                "signal_amplitude_mv": e.signal_amplitude_mv,
                "phase_deg": e.phase_deg,
                "encoder_position_mm": pos_f,
                "position_from_front_mm": pos_f,
                "indication_type": e.indication_type,
                "severity": e.severity,
                "confidence": e.confidence,
                "is_simulated": e.is_simulated,
            })
    elif rec.ndt_results and "eddy_current" in rec.ndt_results:
        ec = rec.ndt_results["eddy_current"]
        if ec.get("status") == "DEFECT_DETECTED":
            eca_items.append({
                "channel_idx": 7,
                "signal_amplitude_mv": ec.get("signal_amplitude_mv", 296.0),
                "phase_deg": 88.5,
                "encoder_position_mm": rec.encoder_entry_position_mm or 650.0,
                "position_from_front_mm": rec.encoder_entry_position_mm or 650.0,
                "indication_type": "SURFACE_CRACK_IMPEDANCE",
                "severity": "MAJOR",
                "confidence": ec.get("confidence", 0.92),
                "is_simulated": True,
            })

    # PAUT Indications
    paut_items = []
    if rec.paut_indications:
        for p in rec.paut_indications:
            pos_f = p.encoder_position_mm or 0.0
            paut_items.append({
                "channel_idx": p.channel_idx,
                "depth_mm": p.depth_mm,
                "amplitude_pct": p.amplitude_pct,
                "amplitude": p.amplitude_pct,
                "encoder_position_mm": pos_f,
                "position_from_front_mm": pos_f,
                "indication_type": p.indication_type,
                "severity": p.severity,
                "confidence": p.confidence,
                "is_simulated": p.is_simulated,
            })
    elif rec.ndt_results and "ultrasonic_testing" in rec.ndt_results:
        ut = rec.ndt_results["ultrasonic_testing"]
        if ut.get("status") == "INTERNAL_FLAW_DETECTED":
            paut_items.append({
                "channel_idx": 32,
                "depth_mm": 75.0,
                "amplitude_pct": 68.0,
                "amplitude": 68.0,
                "encoder_position_mm": 4400.0,
                "position_from_front_mm": 4400.0,
                "indication_type": "INTERNAL_CORE_POROSITY",
                "severity": "CRITICAL",
                "confidence": ut.get("confidence", 0.94),
                "is_simulated": True,
            })

    # OCR items
    ocr_items = [
        {
            "raw_text": o.raw_text,
            "parsed_heat_number": o.parsed_heat_number,
            "parsed_batch_id": o.parsed_batch_id,
            "confidence": o.confidence,
            "bbox": o.bbox,
            "engine_name": o.engine_name,
        }
        for o in rec.ocr_results
    ] if rec.ocr_results else []

    return {
        "id": rec.id,
        "billet_id": rec.billet_id,
        "heat_number": rec.heat_number,
        "batch_id": rec.batch_id,
        "steel_grade": rec.billet.steel_grade if (rec.billet and rec.billet.steel_grade) else "IS 2830 / Fe 500D",
        "timestamp": rec.timestamp,
        "status": rec.status,
        "decision_reason": rec.decision_reason,
        "why_failed_explanation": rec.why_failed_explanation or rec.decision_reason,
        "length_mm": rec.length_mm,
        "width_mm": rec.width_mm,
        "height_mm": rec.height_mm,
        "diameter_mm": rec.diameter_mm,
        "dimension_status": rec.dimension_status,
        "dimension_deviation_pct": rec.dimension_deviation_pct,
        "encoder_entry_position_mm": rec.encoder_entry_position_mm or 0.0,
        "encoder_exit_position_mm": rec.encoder_exit_position_mm or b_len,
        "conveyor_speed_mm_s": rec.conveyor_speed_mm_s or 1000.0,
        "coverage_top": rec.coverage_top or "INSPECTED",
        "coverage_bottom": rec.coverage_bottom or "NOT_INSPECTED",
        "coverage_left": rec.coverage_left or "INSPECTED",
        "coverage_right": rec.coverage_right or "INSPECTED",
        "coverage_front": rec.coverage_front or "INSPECTED",
        "coverage_back": rec.coverage_back or "INSPECTED",
        "defect_count": rec.defect_count,
        "ocr_text": rec.ocr_text,
        "ocr_confidence": rec.ocr_confidence,
        "barcode_value": rec.barcode_value,
        "barcode_type": rec.barcode_type,
        "production_line_id": rec.production_line_id or "LINE-BILLET-01",
        "plant_id": rec.plant_id or "PLANT-RAIPUR-01",
        "operator_id": rec.operator_id or "SYSTEM_AUTO",
        "model_version": rec.model_version,
        "calibration_version": rec.calibration_version,
        "processing_latency_ms": rec.processing_latency_ms,
        "audit_hash": rec.audit_hash,
        "previous_audit_hash": rec.previous_audit_hash,
        "evidence_image": rec.evidence_image,
        "ndt_results": rec.ndt_results or {},
        "dimensions": dim_items,
        "defects": defects_items,
        "ocr_results": ocr_items,
        "eca_indications": eca_items,
        "paut_indications": paut_items,
    }

@router.get("/api/inspections/{inspection_id}/report", tags=["Reports"])
def download_individual_pdf_report(inspection_id: str, db: Session = Depends(get_db)):
    rec = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    rec_dict = _serialize_inspection_for_export(rec)

    pdf_filename = f"Inspection_Passport_{inspection_id}.pdf"
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
    records_dict = [_serialize_inspection_for_export(r) for r in records]

    excel_filename = "billet_inspection_audit.xlsx"
    excel_path = settings.EXPORTS_PATH / excel_filename
    export_audit_excel(records_dict, excel_path)

    return FileResponse(
        path=str(excel_path),
        filename=excel_filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

@router.get("/api/export/csv", tags=["Reports"])
def download_csv_export(
    export_type: str = "inspections",
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
    records_dict = [_serialize_inspection_for_export(r) for r in records]

    exp_type = export_type.lower().strip()
    if exp_type == "defects":
        csv_filename = "defects.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_defects_csv(records_dict, csv_path)
    elif exp_type in ["eca", "eca_indications"]:
        csv_filename = "eca_indications.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_eca_csv(records_dict, csv_path)
    elif exp_type in ["paut", "paut_indications"]:
        csv_filename = "paut_indications.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_paut_csv(records_dict, csv_path)
    elif exp_type in ["measurements", "dimensions"]:
        csv_filename = "measurements.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_measurements_csv(records_dict, csv_path)
    elif exp_type == "audit":
        csv_filename = "audit.csv"
        csv_path = settings.EXPORTS_PATH / csv_filename
        export_audit_csv(records_dict, csv_path)
    else:
        csv_filename = "billets.csv"
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
    records_dict = [_serialize_inspection_for_export(r) for r in records]
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

@router.get("/api/system/hardware", tags=["Hardware"])
def get_hardware_hal_status():
    from backend.hardware.adapters.demo_encoder import encoder_service
    from backend.hardware.adapters.demo_laser import laser_service
    from backend.hardware.adapters.demo_eca import eca_service
    from backend.hardware.adapters.demo_paut import paut_service
    from backend.hardware.adapters.demo_plc import plc_service
    from backend.hardware.adapters.industrial_adapters import (
        IndustrialCameraAdapter,
        IndustrialEncoderAdapter,
        IndustrialLaser3DAdapter,
        IndustrialECAAdapter,
        IndustrialPAUTAdapter,
        PLCAdapter,
    )

    return {
        "mode": "DEMO_SIMULATION",
        "mode_label": "SIMULATION / DEMO MODE (HARDWARE READY ARCHITECTURE)",
        "disclaimer": "Physical ECA and PAUT instruments are not connected. All NDT volumetric profiles and multi-channel impedance streams are computed by calibrated mathematical simulators.",
        "active_demo_adapters": {
            "encoder": encoder_service.get_status(),
            "laser_3d": laser_service.get_status(),
            "eca_array": eca_service.get_status(),
            "paut_phased_array": paut_service.get_status(),
            "plc_controller": plc_service.get_status(),
        },
        "planned_industrial_adapters": {
            "industrial_gige_cameras": IndustrialCameraAdapter().get_status(),
            "industrial_encoder": IndustrialEncoderAdapter().get_status(),
            "industrial_3d_laser": IndustrialLaser3DAdapter().get_status(),
            "industrial_eca": IndustrialECAAdapter().get_status(),
            "industrial_paut": IndustrialPAUTAdapter().get_status(),
            "industrial_plc": PLCAdapter().get_status(),
        }
    }

@router.get("/api/system/coverage", tags=["System"])
def get_inspection_coverage_map():
    return {
        "plant_station": "NIT Raipur Cooling Bed Rig #01",
        "surfaces": {
            "TOP": {"status": "INSPECTED", "sensors": ["GigE-CAM-01", "Laser-3D-01", "ECA-Array-01"], "coverage_pct": 100.0},
            "BOTTOM": {"status": "NOT_INSPECTED", "sensors": [], "coverage_pct": 0.0, "reason": "Physical conveyor roller contact surface. Requires downstream turn-over station or separate bottom optical array."},
            "LEFT": {"status": "INSPECTED", "sensors": ["GigE-CAM-03"], "coverage_pct": 100.0},
            "RIGHT": {"status": "INSPECTED", "sensors": ["GigE-CAM-04"], "coverage_pct": 100.0},
            "FRONT_END": {"status": "INSPECTED", "sensors": ["GigE-CAM-05 (OCR/Barcode)"], "coverage_pct": 100.0},
            "BACK_END": {"status": "INSPECTED", "sensors": ["GigE-CAM-02"], "coverage_pct": 100.0},
        }
    }

@router.get("/api/ndt/scan", tags=["NDT"])
def get_ndt_scan_data(
    encoder_pos_mm: float = 650.0,
    heat_number: str = "26A-1042",
    include_full_sweep: bool = False,
    billet_length_mm: float = 6000.0,
    billet_id: str = "BILLET-00023",
):
    from backend.hardware.adapters.demo_eca import eca_service
    from backend.hardware.adapters.demo_paut import paut_service

    inject_paut_single = 4200.0 if abs(encoder_pos_mm - 4200.0) < 50.0 else None
    eca_data = eca_service.acquire_scan_slice(encoder_pos_mm=encoder_pos_mm, inject_defect_at_mm=encoder_pos_mm, defect_channel=7)
    paut_data = paut_service.acquire_volumetric_slice(
        encoder_pos_mm=encoder_pos_mm,
        inject_internal_flaw_at_mm=inject_paut_single,
        flaw_depth_mm=75.0,
        billet_id=billet_id,
    )

    sweep_matrix = []
    paut_bscan_matrix = []
    if include_full_sweep:
        step_mm = 200.0
        steps = int(billet_length_mm / step_mm)
        for i in range(steps):
            pos = i * step_mm
            # Inject defect at 650mm for ECA and 4200mm for PAUT for demonstration
            inject_eca = 650.0 if abs(pos - 650.0) < 150.0 else None
            inject_paut = 4200.0 if abs(pos - 4200.0) < 150.0 else None
            
            s_slice = eca_service.acquire_scan_slice(encoder_pos_mm=pos, inject_defect_at_mm=inject_eca, defect_channel=7)
            p_slice = paut_service.acquire_volumetric_slice(
                encoder_pos_mm=pos,
                inject_internal_flaw_at_mm=inject_paut,
                flaw_depth_mm=75.0,
                billet_id=billet_id,
            )
            
            sweep_matrix.append({
                "encoder_pos_mm": pos,
                "max_amplitude_mv": s_slice["max_amplitude_mv"],
                "has_indication": s_slice["has_indication"],
                "channels": [ch["amplitude_mv"] for ch in s_slice["channels"]],
            })
            paut_bscan_matrix.append({
                "billet_id": p_slice["paut_indication"]["billet_id"],
                "encoder_pos_mm": pos,
                "encoder_position_mm": pos,
                "depth_mm": p_slice["paut_indication"]["depth_mm"],
                "amplitude": p_slice["paut_indication"]["amplitude"],
                "channel": p_slice["paut_indication"]["channel"],
                "timestamp": p_slice["paut_indication"]["timestamp"],
                "peak_amplitude_pct": p_slice["paut_indication"]["amplitude"],
                "has_internal_flaw": p_slice["has_internal_flaw"],
                "flaw_depth_mm": p_slice["paut_indication"]["depth_mm"],
            })

    return {
        "mode": "SIMULATION / DEMO MODE",
        "billet_id": billet_id,
        "encoder_position_mm": encoder_pos_mm,
        "heat_number": heat_number,
        "eca_channel_grid": eca_data,
        "paut_volumetric_scan": paut_data,
        "paut_indication": paut_data["paut_indication"],
        "eca_sweep_matrix": sweep_matrix,
        "paut_bscan_matrix": paut_bscan_matrix,
    }

@router.get("/api/digital-twin/{identifier}", tags=["Digital Twin"])
def get_digital_billet_twin(identifier: str, db: Session = Depends(get_db)):
    # Search by inspection ID or Billet ID
    rec = db.query(models.Inspection).filter(
        (models.Inspection.id == identifier) | (models.Inspection.billet_id == identifier)
    ).first()

    if not rec:
        # Check if billet exists
        billet = db.query(models.Billet).filter(models.Billet.id == identifier).first()
        if billet and billet.inspections:
            rec = billet.inspections[0]

    if not rec:
        raise HTTPException(status_code=404, detail="Billet Twin record not found.")

    # Multi-sensor timeline synthesis
    base_time = rec.timestamp or datetime.utcnow()
    timeline = [
        {"time": "08:21:03", "event": "Conveyor Entry & Photo-Eye Trigger", "sensor": "PLC / Encoder", "status": "CONFIRMED"},
        {"time": "08:21:04", "event": f"OCR End-Face Markings Detected: {rec.ocr_text or rec.heat_number}", "sensor": "CAM-05 Optical", "status": "VERIFIED"},
        {"time": "08:21:05", "event": f"Calibrated Optical Metrology (L: {rec.length_mm} mm, W×H: {rec.width_mm}×{rec.height_mm} mm)", "sensor": "CAM-01 / Homography", "status": rec.dimension_status},
        {"time": "08:21:06", "event": f"Surface Flaw Scan ({rec.defect_count} anomalies detected)", "sensor": "CAM-01 / Neural Segmentation", "status": "RECORDED"},
        {"time": "08:21:07", "event": "Eddy Current Array (ECA) Near-Surface Sweep", "sensor": "ECA-01 [SIMULATION]", "status": "COMPLETED"},
        {"time": "08:21:08", "event": "Phased Array Ultrasonic (PAUT) Volumetric Core Scan", "sensor": "PAUT-01 [SIMULATION]", "status": "COMPLETED"},
        {"time": "08:21:09", "event": f"Final Quality Decision: {rec.status} ({rec.decision_reason})", "sensor": "Decision Engine", "status": rec.status},
    ]

    paut_indications_list = [
        {
            "billet_id": p.billet_id or rec.billet_id,
            "encoder_position_mm": p.encoder_position_mm,
            "depth_mm": p.depth_mm,
            "amplitude": p.amplitude_pct,
            "channel": p.channel_idx,
            "timestamp": p.timestamp.timestamp() if p.timestamp else (rec.timestamp.timestamp() if rec.timestamp else time.time()),
            "indication_type": p.indication_type,
            "severity": p.severity,
            "confidence": p.confidence,
            "is_simulated": p.is_simulated,
        }
        for p in rec.paut_indications
    ] if rec.paut_indications else []

    primary_paut_indication = paut_indications_list[0] if paut_indications_list else {
        "billet_id": rec.billet_id,
        "encoder_position_mm": round(rec.encoder_entry_position_mm or 650.0, 1),
        "depth_mm": None,
        "amplitude": 8.0,
        "channel": 32,
        "timestamp": rec.timestamp.timestamp() if rec.timestamp else time.time(),
        "has_internal_flaw": False,
        "indication_type": "NORMAL",
    }

    return {
        "billet_id": rec.billet_id,
        "inspection_id": rec.id,
        "heat_number": rec.heat_number,
        "batch_id": rec.batch_id,
        "steel_grade": "IS 2830 / Fe 500D",
        "status": rec.status,
        "decision_reason": rec.decision_reason,
        "why_failed_explanation": rec.why_failed_explanation or rec.decision_reason,
        "timestamp": rec.timestamp,
        "dimensions": {
            "length_mm": rec.length_mm,
            "width_mm": rec.width_mm,
            "height_mm": rec.height_mm,
            "dimension_status": rec.dimension_status,
        },
        "coverage_map": {
            "TOP": rec.coverage_top or "INSPECTED",
            "BOTTOM": rec.coverage_bottom or "NOT_INSPECTED",
            "LEFT": rec.coverage_left or "INSPECTED",
            "RIGHT": rec.coverage_right or "INSPECTED",
            "FRONT": rec.coverage_front or "INSPECTED",
            "BACK": rec.coverage_back or "INSPECTED",
        },
        "defects": [
            {
                "id": d.id,
                "defect_type": d.defect_type,
                "severity": d.severity,
                "confidence": d.confidence,
                "surface_face": d.surface_face,
                "encoder_pos_mm": d.encoder_pos_mm or 0.0,
                "length_mm": d.length_mm,
                "width_mm": d.width_mm,
                "area_mm2": d.area_mm2,
                "crop_path": d.crop_path,
            }
            for d in rec.defects
        ],
        "ndt_results": rec.ndt_results or {},
        "paut_indication": primary_paut_indication,
        "paut_indications": paut_indications_list,
        "timeline": timeline,
        "audit_hash": rec.audit_hash,
        "previous_audit_hash": rec.previous_audit_hash,
        "evidence_image": rec.evidence_image,
        "processing_latency_ms": rec.processing_latency_ms,
    }

@router.get("/api/settings", tags=["Configuration"])
def get_system_settings():
    return {
        "plant": settings.plant_config,
        "cameras": settings.camera_config,
        "tolerances": settings.tolerances_config,
        "models": settings.models_config,
        "alerts": settings.alerts_config,
    }

