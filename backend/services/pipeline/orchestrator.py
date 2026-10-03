import os
import time
import cv2
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.security import calculate_audit_hash, GENESIS_HASH
from backend.core.events import manager
from backend.models_db import models
from backend.services.camera.provider import camera_manager, CameraFrame
from backend.services.tracking.tracker import billet_tracker, BilletState
from backend.services.metrology.metrology_engine import metrology_engine
from backend.services.defect.defect_engine import defect_engine
from backend.services.ocr.ocr_engine import ocr_engine
from backend.services.barcode.barcode_engine import barcode_engine
from backend.services.ndt.sensor_fusion import ndt_engine
from backend.services.decision.decision_engine import decision_engine
from backend.services.plc.plc_adapter import plc_service

logger = logging.getLogger("billet.pipeline")

class InspectionPipelineOrchestrator:
    """
    Core End-to-End Industrial Inspection Pipeline Orchestrator.
    Executes synchronous cycle from camera frame capture through metrology, defect segmentation,
    OCR, decision gating, cryptographic audit logging, database persistence, and WebSocket dispatch.
    """
    def __init__(self):
        self.pipeline_name = "SteelBillet-FullVisionAuditPipeline-v2.4"

    async def execute_inspection(
        self,
        db: Session,
        billet_id: Optional[str] = None,
        heat_number: Optional[str] = None,
        batch_id: Optional[str] = None,
        defect_scenario: Optional[str] = None,
        simulated_length: Optional[float] = None,
        force_ocr_fail: bool = False,
        camera_id: str = "CAM-01",
    ) -> Dict[str, Any]:
        """Runs complete inspection pipeline for a single billet pass."""
        start_time = time.time()
        
        # 1. Billet & Heat Identity Setup
        b_id = billet_id or f"BILLET-{int(time.time()*1000)%100000:05d}"
        heat_no = heat_number or f"26A-{random_heat_suffix()}"
        batch_no = batch_id or f"BATCH-{int(time.time())%1000:03d}"

        # 2. Tracking Registration (Prevent duplicates)
        tracking_session = billet_tracker.register_or_get_billet(
            billet_id=b_id,
            heat_number=heat_no,
            batch_id=batch_no,
            frame_idx=camera_manager.cameras.get(camera_id, camera_manager.cameras["CAM-01"]).frame_counter + 1,
        )

        # 3. Frame Capture from Camera System
        tracking_session.transition_to(BilletState.INSPECTING)
        cam = camera_manager.cameras.get(camera_id, camera_manager.cameras["CAM-01"])
        frame: Optional[CameraFrame] = cam.capture_frame(
            defect_type=defect_scenario,
            heat_number=f"HEAT-{heat_no}",
            batch_id=batch_no,
            out_of_tolerance=(simulated_length is not None and (simulated_length < 5800 or simulated_length > 6200)),
        )

        if frame is None:
            raise RuntimeError("Camera frame capture failed.")

        # 4. Dimensional Metrology
        tracking_session.transition_to(BilletState.MEASURING)
        dim_results = metrology_engine.measure_billet_dimensions(
            image=frame.image,
            camera_id=camera_id,
            simulated_length_override=simulated_length,
        )

        # 5. OCR & Barcode Decoding
        tracking_session.transition_to(BilletState.OCR)
        ocr_results = ocr_engine.read_markings(
            image=frame.image,
            camera_id="CAM-05",
            simulated_ocr_text=f"HEAT-{heat_no} | {batch_no}" if not force_ocr_fail else None,
            force_failure=force_ocr_fail,
        )
        barcode_results = barcode_engine.decode(frame.image, camera_id=camera_id)

        # 6. Surface Defect & Fine-Crack Segmentation
        tracking_session.transition_to(BilletState.DEFECT_ANALYSIS)
        defects, mask_overlay, _ = defect_engine.detect_and_segment_defects(
            image=frame.image,
            camera_id=camera_id,
            surface_face="TOP",
            simulated_defect_type=defect_scenario,
        )

        # 7. NDT Sensor Fusion
        ndt_fusion = ndt_engine.process_sensor_readings(
            vision_defects=defects,
            simulated_ndt_trigger=None,
        )

        # 8. Quality Decision Engine
        tracking_session.transition_to(BilletState.DECISION)
        status, reason, rules_triggered, generated_alerts = decision_engine.evaluate(
            dimensions=dim_results,
            defects=defects,
            ocr_result=ocr_results,
            ndt_result=ndt_fusion,
            calibration_valid=True,
            camera_online=True,
        )

        # 9. Save Visual Evidence & Overlays to Permanent Storage
        ins_id = tracking_session.inspection_id or billet_tracker.generate_inspection_id()
        evidence_filename = f"{ins_id}_evidence.jpg"
        evidence_save_path = settings.INSPECTION_IMAGES_PATH / evidence_filename
        
        # Merge defect overlay onto raw image for visual display
        annotated_image = cv2.addWeighted(frame.image, 0.85, mask_overlay, 0.8, 0)
        cv2.imwrite(str(evidence_save_path), annotated_image)
        
        evidence_url = f"/storage/inspection-images/{evidence_filename}"

        # Latency calculation
        latency_ms = round((time.time() - start_time) * 1000.0, 1)

        # 10. Audit Trail Cryptographic Hash Calculation (SHA-256 Hash Chaining)
        last_rec = db.query(models.Inspection).order_by(models.Inspection.created_at.desc()).first()
        prev_hash = last_rec.audit_hash if last_rec else GENESIS_HASH
        ins_timestamp = datetime.utcnow()

        inspection_payload = {
            "inspection_id": ins_id,
            "billet_id": b_id,
            "heat_number": heat_no,
            "batch_id": batch_no,
            "timestamp": str(ins_timestamp),
            "status": status,
            "length_mm": dim_results["length_mm"],
            "width_mm": dim_results["width_mm"],
            "height_mm": dim_results["height_mm"],
            "defect_count": len(defects),
            "ocr_text": ocr_results["raw_text"],
            "decision_reason": reason,
            "model_version": defect_engine.model_version,
            "calibration_version": dim_results["calibration_version"],
        }
        curr_audit_hash = calculate_audit_hash(prev_hash, inspection_payload)

        # 11. Database Persistence (Permanent Entity Model)
        # Ensure Billet record exists
        billet_obj = db.query(models.Billet).filter(models.Billet.id == b_id).first()
        if not billet_obj:
            billet_obj = models.Billet(
                id=b_id,
                heat_number=heat_no,
                batch_id=batch_no,
                steel_grade="IS 2830 / Fe 500D",
                nominal_length_mm=6000.0,
                nominal_section_mm=150.0,
            )
            db.add(billet_obj)
            db.flush()

        # Create Inspection record
        inspection_rec = models.Inspection(
            id=ins_id,
            billet_id=b_id,
            plant_id="PLANT-RAIPUR-01",
            production_line_id="LINE-BILLET-01",
            heat_number=heat_no,
            batch_id=batch_no,
            camera_ids=["CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05"],
            length_mm=dim_results["length_mm"],
            width_mm=dim_results["width_mm"],
            height_mm=dim_results["height_mm"],
            diameter_mm=dim_results["diameter_mm"],
            dimension_deviation_pct=dim_results["max_deviation_pct"],
            dimension_status=dim_results["status"],
            ocr_text=ocr_results["raw_text"],
            ocr_confidence=ocr_results["confidence"],
            barcode_value=barcode_results["barcode_value"],
            barcode_type=barcode_results["barcode_type"],
            defect_count=len(defects),
            has_critical_defect=any(d["severity"] == "CRITICAL" for d in defects),
            has_major_defect=any(d["severity"] == "MAJOR" for d in defects),
            status=status,
            decision_reason=reason,
            rules_triggered=rules_triggered,
            processing_latency_ms=latency_ms,
            model_version=defect_engine.model_version,
            calibration_version=dim_results["calibration_version"],
            review_status="PENDING" if status == "NEEDS_REVIEW" else "NOT_REQUIRED",
            evidence_image=evidence_url,
            ocr_crop_reference=ocr_results.get("crop_path"),
            defect_crop_references=[d["crop_path"] for d in defects if d.get("crop_path")],
            ndt_results=ndt_fusion,
            audit_hash=curr_audit_hash,
            previous_audit_hash=prev_hash,
            timestamp=ins_timestamp,
        )
        db.add(inspection_rec)
        db.flush()

        # Add Dimensional Details
        for d_item in dim_results.get("dimension_items", []):
            dim_rec = models.Dimension(
                inspection_id=ins_id,
                dimension_name=d_item["dimension_name"],
                measured_value_mm=d_item["measured_value_mm"],
                nominal_mm=d_item["nominal_mm"],
                expected_min_mm=d_item["expected_min_mm"],
                expected_max_mm=d_item["expected_max_mm"],
                deviation_pct=d_item["deviation_pct"],
                status=d_item["status"],
                camera_id=d_item["camera_id"],
            )
            db.add(dim_rec)

        # Add Defect Details
        for d_info in defects:
            defect_rec = models.Defect(
                id=f"{ins_id}-{d_info['id']}",
                inspection_id=ins_id,
                defect_type=d_info["defect_type"],
                severity=d_info["severity"],
                confidence=d_info["confidence"],
                camera_id=d_info["camera_id"],
                surface_face=d_info["surface_face"],
                x_pos_px=d_info["x_pos_px"],
                y_pos_px=d_info["y_pos_px"],
                bbox_xywh=d_info["bbox_xywh"],
                length_mm=d_info["length_mm"],
                width_mm=d_info["width_mm"],
                area_mm2=d_info["area_mm2"],
                orientation_deg=d_info["orientation_deg"],
                crop_path=d_info.get("crop_path"),
            )
            db.add(defect_rec)

        # Add OCR Record
        ocr_rec = models.OCRResult(
            inspection_id=ins_id,
            raw_text=ocr_results["raw_text"],
            parsed_heat_number=ocr_results["heat_number"],
            parsed_batch_id=ocr_results["batch_id"],
            confidence=ocr_results["confidence"],
            bbox=ocr_results["bbox"],
            camera_id="CAM-05",
            engine_name=ocr_results["engine_name"],
        )
        db.add(ocr_rec)

        # Add Alerts if triggered
        for alt in generated_alerts:
            alt_id = f"ALT-{int(time.time()*1000)%1000000:06d}"
            alert_rec = models.Alert(
                id=alt_id,
                inspection_id=ins_id,
                alert_type=alt["type"],
                severity=alt["severity"],
                title=alt["title"],
                message=alt["message"],
                details={"billet_id": b_id, "heat_number": heat_no, "status": status},
                timestamp=datetime.utcnow(),
            )
            db.add(alert_rec)

        # Add Audit Event
        audit_event = models.AuditEvent(
            inspection_id=ins_id,
            action="INSPECTION_CREATED",
            actor_id="AI_PIPELINE_DAEMON",
            details={"rules": rules_triggered, "latency_ms": latency_ms},
            audit_hash_snapshot=curr_audit_hash,
            timestamp=datetime.utcnow(),
        )
        db.add(audit_event)

        db.commit()

        # 12. PLC Signal Output
        plc_service.send_decision(
            inspection_id=ins_id,
            billet_id=b_id,
            decision=status,
            reason=reason,
        )

        # 13. Complete Tracker Session
        billet_tracker.mark_completed(tracking_session.session_id)

        # 14. Real-Time Broadcasts via WebSockets
        inspection_data = {
            "id": ins_id,
            "billet_id": b_id,
            "heat_number": heat_no,
            "batch_id": batch_no,
            "timestamp": inspection_rec.timestamp.isoformat(),
            "status": status,
            "decision_reason": reason,
            "length_mm": dim_results["length_mm"],
            "width_mm": dim_results["width_mm"],
            "height_mm": dim_results["height_mm"],
            "defect_count": len(defects),
            "ocr_text": ocr_results["raw_text"],
            "ocr_confidence": ocr_results["confidence"],
            "processing_latency_ms": latency_ms,
            "evidence_image": evidence_url,
            "audit_hash": curr_audit_hash,
            "defects": defects,
            "dimensions": dim_results["dimension_items"],
        }
        await manager.broadcast_inspection("INSPECTION_COMPLETED", inspection_data)
        
        for alt in generated_alerts:
            await manager.broadcast_alert({
                "id": f"ALT-{int(time.time()*1000)%1000000:06d}",
                "inspection_id": ins_id,
                "billet_id": b_id,
                "heat_number": heat_no,
                "alert_type": alt["type"],
                "severity": alt["severity"],
                "title": alt["title"],
                "message": alt["message"],
                "timestamp": datetime.utcnow().isoformat(),
            })

        logger.info(f"Inspection complete: {ins_id} [{status}] ({latency_ms} ms)")
        return inspection_data

def random_heat_suffix() -> str:
    import random
    return f"{random.randint(1010, 9999)}"

pipeline_orchestrator = InspectionPipelineOrchestrator()
