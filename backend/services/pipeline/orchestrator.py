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
from backend.services.decision.decision_engine import decision_engine

# Hardware Abstraction Layer (HAL) Adapters
from backend.hardware.adapters.demo_encoder import encoder_service
from backend.hardware.adapters.demo_laser import laser_service
from backend.hardware.adapters.demo_eca import eca_service
from backend.hardware.adapters.demo_paut import paut_service
from backend.hardware.adapters.demo_plc import plc_service

logger = logging.getLogger("billet.pipeline")

class InspectionPipelineOrchestrator:
    """
    Core End-to-End Multimodal Industrial Inspection Pipeline Orchestrator.
    Synchronizes Optical Vision, Dimensional Metrology, 3D Laser Triangulation,
    OCR Identification, Multi-Channel ECA, Volumetric PAUT, and Physical Rotary Encoder.
    """
    def __init__(self):
        self.pipeline_name = "BilletVision-MultimodalOrchestrator-v3.0"

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
        raw_frame_image: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Runs complete multimodal inspection pipeline for a single billet pass."""
        start_time = time.time()
        stage_timings: List[Dict[str, Any]] = []

        def log_stage(name: str, st_time: float, status: str = "DONE"):
            stage_timings.append({
                "stage": name,
                "latency_ms": round((time.time() - st_time) * 1000.0, 2),
                "status": status,
            })

        # Stage 1: Identity & Tracking Setup
        s1 = time.time()
        b_id = billet_id or f"BILLET-{int(time.time()*1000)%100000:05d}"
        heat_no = heat_number or f"26A-{int(time.time()) % 9000 + 1000}"
        batch_no = batch_id or f"BATCH-{int(time.time())%1000:03d}"

        tracking_session = billet_tracker.register_or_get_billet(
            billet_id=b_id,
            heat_number=heat_no,
            batch_id=batch_no,
            frame_idx=camera_manager.cameras.get(camera_id, camera_manager.cameras["CAM-01"]).frame_counter + 1,
        )
        log_stage("ACQUIRE_IDENTITY", s1)

        # Stage 2: Encoder Position Capture
        s2 = time.time()
        encoder_pos_mm = encoder_service.get_position_mm()
        conveyor_speed_mm_s = encoder_service.get_velocity_mm_s()
        log_stage("POSITION_ENCODER", s2)

        # Stage 3: Frame Acquisition
        s3 = time.time()
        tracking_session.transition_to(BilletState.INSPECTING)
        if raw_frame_image is not None:
            frame_img = raw_frame_image
            if len(frame_img.shape) == 2:
                frame_img = cv2.cvtColor(frame_img, cv2.COLOR_GRAY2BGR)
            elif frame_img.shape[2] == 4:
                frame_img = cv2.cvtColor(frame_img, cv2.COLOR_RGBA2BGR)
            frame: Optional[CameraFrame] = CameraFrame(
                camera_id=camera_id,
                frame_idx=int(time.time() * 1000) % 100000,
                timestamp=time.time(),
                image=frame_img,
                metadata={"source": "LIVE_CONVEYOR_VIDEO", "resolution": f"{frame_img.shape[1]}x{frame_img.shape[0]}"}
            )
        else:
            cam = camera_manager.cameras.get(camera_id, camera_manager.cameras["CAM-01"])
            frame: Optional[CameraFrame] = cam.capture_frame(
                defect_type=defect_scenario,
                heat_number=f"HEAT-{heat_no}",
                batch_id=batch_no,
                out_of_tolerance=(simulated_length is not None and (simulated_length < 5800 or simulated_length > 6200)),
            )

        if frame is None:
            raise RuntimeError("Camera frame capture failed.")
        log_stage("CAMERA_ACQUISITION", s3)

        # Stage 4: Dimensional Metrology (Length, Width, Height)
        s4 = time.time()
        tracking_session.transition_to(BilletState.MEASURING)
        dim_results = metrology_engine.measure_billet_dimensions(
            image=frame.image,
            camera_id=camera_id,
            simulated_length_override=simulated_length,
        )
        log_stage("METROLOGY_DIMENSIONS", s4)

        # Stage 5: 3D Laser Triangulation Profiling
        s5 = time.time()
        laser_profile = laser_service.acquire_profile(
            encoder_pos_mm=encoder_pos_mm,
            inject_surface_depression_at_mm=encoder_pos_mm if defect_scenario in ["SCAB", "ROLL_MARK"] else None,
        )
        log_stage("LASER_3D_SURFACE", s5, status="SIMULATED")

        # Stage 6: OCR End-Face Identification & Barcode Decoding
        s6 = time.time()
        tracking_session.transition_to(BilletState.OCR)
        ocr_results = ocr_engine.read_markings(
            image=frame.image,
            camera_id="CAM-05",
            simulated_ocr_text=f"HEAT-{heat_no} | {batch_no}" if not force_ocr_fail else None,
            force_failure=force_ocr_fail,
        )
        barcode_results = barcode_engine.decode(frame.image, camera_id=camera_id)
        log_stage("OCR_IDENTIFICATION", s6)

        # Stage 7: Surface Defect Segmentation
        s7 = time.time()
        tracking_session.transition_to(BilletState.DEFECT_ANALYSIS)
        defects, mask_overlay, _ = defect_engine.detect_and_segment_defects(
            image=frame.image,
            camera_id=camera_id,
            surface_face="TOP",
            simulated_defect_type=defect_scenario,
        )
        # Attach physical encoder position to each defect
        for d in defects:
            d["encoder_pos_mm"] = round(encoder_pos_mm + (d.get("x_pos_px", 200) / 1000.0) * 1500.0, 1)
        log_stage("SURFACE_DEFECT_SEGMENTATION", s7)

        # Stage 8: Eddy Current Array (ECA) Surface Flaw Simulation
        s8 = time.time()
        inject_eca_mm = None
        has_vision_crack = any("crack" in d.get("defect_type", "").lower() or "seam" in d.get("defect_type", "").lower() for d in defects)
        if has_vision_crack or defect_scenario in ["MAJOR_CRACK", "MINOR_CRACK", "TRANSVERSE_CRACK"]:
            inject_eca_mm = encoder_pos_mm

        eca_reading = eca_service.acquire_scan_slice(
            encoder_pos_mm=encoder_pos_mm,
            inject_defect_at_mm=inject_eca_mm,
            defect_channel=7,
        )
        log_stage("ECA_INSPECTION", s8, status="SIMULATED")

        # Stage 9: Phased Array Ultrasonic Testing (PAUT) Volumetric Simulation
        s9 = time.time()
        inject_paut_mm = encoder_pos_mm if defect_scenario == "INTERNAL_INCLUSION" else None
        paut_reading = paut_service.acquire_volumetric_slice(
            encoder_pos_mm=encoder_pos_mm,
            inject_internal_flaw_at_mm=inject_paut_mm,
            flaw_depth_mm=75.0,
        )
        log_stage("PAUT_INSPECTION", s9, status="SIMULATED")

        # Stage 10: Multi-Modal Sensor Fusion & Decision Evaluation
        s10 = time.time()
        tracking_session.transition_to(BilletState.DECISION)
        
        # Build Sensor Fusion Payload
        ndt_fusion_summary = {
            "mode_label": "SIMULATION / DEMO MODE",
            "eddy_current": {
                "sensor_id": eca_reading["sensor_id"],
                "signal_amplitude_mv": eca_reading["max_amplitude_mv"],
                "threshold_mv": eca_reading["threshold_mv"],
                "status": "DEFECT_DETECTED" if eca_reading["has_indication"] else "NORMAL",
                "confidence": 0.92,
                "is_simulated": True,
            },
            "ultrasonic_testing": {
                "sensor_id": paut_reading["sensor_id"],
                "attenuation_db": paut_reading["peak_flaw_amplitude_pct"],
                "threshold_db": paut_reading["threshold_pct"],
                "status": "INTERNAL_FLAW_DETECTED" if paut_reading["has_internal_flaw"] else "NORMAL",
                "confidence": 0.94,
                "is_simulated": True,
            },
            "laser_3d": {
                "sensor_id": laser_profile["sensor_id"],
                "mean_height_mm": laser_profile["measured_mean_height_mm"],
                "has_anomaly": laser_profile["has_topography_anomaly"],
                "is_simulated": True,
            },
            "fusion_status": "CONCORDANT" if (has_vision_crack == eca_reading["has_indication"]) else "MULTI_MODAL_CROSS_VALIDATION",
            "subsurface_defects": [
                {
                    "type": "Internal Core Porosity / Inclusion",
                    "depth_from_surface_mm": paut_reading["flaw_depth_mm"],
                    "confidence": 0.94,
                    "severity": "CRITICAL",
                }
            ] if paut_reading["has_internal_flaw"] else [],
        }

        status, reason, rules_triggered, generated_alerts = decision_engine.evaluate(
            dimensions=dim_results,
            defects=defects,
            ocr_result=ocr_results,
            ndt_result=ndt_fusion_summary,
            calibration_valid=True,
            camera_online=True,
        )

        # Transparent Decision Root-Cause Breakdown ("Why did this billet fail?")
        why_failed_points: List[str] = []
        if dim_results["status"] == "FAIL":
            why_failed_points.append(f"Dimension outside configured envelope: Length {dim_results['length_mm']} mm (Nominal: 6000.0 ±200.0 mm).")
        if any(d["severity"] == "CRITICAL" for d in defects):
            why_failed_points.append(f"Critical surface crack detected by optical camera (Length >15mm).")
        if any(d["severity"] == "MAJOR" for d in defects):
            why_failed_points.append(f"Major surface flaw flagged for conditioning / scarfing.")
        if eca_reading["has_indication"]:
            why_failed_points.append(f"ECA electromagnetic impedance anomaly ({eca_reading['max_amplitude_mv']} mV >= {eca_reading['threshold_mv']} mV threshold) correlated at {round(encoder_pos_mm, 1)} mm.")
        if paut_reading["has_internal_flaw"]:
            why_failed_points.append(f"PAUT volumetric reflection ({paut_reading['peak_flaw_amplitude_pct']}%) indicates internal core porosity at depth {paut_reading['flaw_depth_mm']} mm.")
        if ocr_results.get("confidence", 1.0) < 0.85:
            why_failed_points.append(f"OCR reading confidence ({Math_round(ocr_results.get('confidence', 0)*100)}%) below automated acceptance threshold.")

        why_failed_explanation = " · ".join(why_failed_points) if why_failed_points else "All dimensional, surface, and traceability criteria met. Conforming billet."
        log_stage("SENSOR_FUSION_DECISION", s10)

        # Stage 11: Save Evidence Images & Annotations
        ins_id = tracking_session.inspection_id or billet_tracker.generate_inspection_id()
        evidence_filename = f"{ins_id}_evidence.jpg"
        evidence_save_path = settings.INSPECTION_IMAGES_PATH / evidence_filename
        
        annotated_image = cv2.addWeighted(frame.image, 0.85, mask_overlay, 0.8, 0)
        cv2.imwrite(str(evidence_save_path), annotated_image)
        evidence_url = f"/storage/inspection-images/{evidence_filename}"

        total_latency_ms = round((time.time() - start_time) * 1000.0, 1)

        # Stage 12: Cryptographic Audit Hash Chaining (SHA-256)
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

        # Stage 13: Database Persistence (Digital Twin & Audit Schema)
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

        inspection_rec = models.Inspection(
            id=ins_id,
            billet_id=b_id,
            plant_id="PLANT-RAIPUR-01",
            production_line_id="LINE-BILLET-01",
            heat_number=heat_no,
            batch_id=batch_no,
            camera_ids=["CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05"],
            encoder_entry_position_mm=round(encoder_pos_mm, 1),
            encoder_exit_position_mm=round(encoder_pos_mm + dim_results["length_mm"], 1),
            conveyor_speed_mm_s=conveyor_speed_mm_s,
            coverage_top="INSPECTED",
            coverage_bottom="NOT_INSPECTED", # Transparent physical disclaimer
            coverage_left="INSPECTED",
            coverage_right="INSPECTED",
            coverage_front="INSPECTED",
            coverage_back="INSPECTED",
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
            why_failed_explanation=why_failed_explanation,
            rules_triggered=rules_triggered,
            processing_latency_ms=total_latency_ms,
            model_version=defect_engine.model_version,
            calibration_version=dim_results["calibration_version"],
            review_status="PENDING" if status == "NEEDS_REVIEW" else "NOT_REQUIRED",
            evidence_image=evidence_url,
            ocr_crop_reference=ocr_results.get("crop_path"),
            defect_crop_references=[d["crop_path"] for d in defects if d.get("crop_path")],
            ndt_results=ndt_fusion_summary,
            audit_hash=curr_audit_hash,
            previous_audit_hash=prev_hash,
            timestamp=ins_timestamp,
        )
        db.add(inspection_rec)
        db.flush()

        # Add Dimensions
        for d_item in dim_results.get("dimension_items", []):
            db.add(models.Dimension(
                inspection_id=ins_id,
                dimension_name=d_item["dimension_name"],
                measured_value_mm=d_item["measured_value_mm"],
                nominal_mm=d_item["nominal_mm"],
                expected_min_mm=d_item["expected_min_mm"],
                expected_max_mm=d_item["expected_max_mm"],
                deviation_pct=d_item["deviation_pct"],
                status=d_item["status"],
                camera_id=d_item["camera_id"],
            ))

        # Add Surface Defects
        for d_info in defects:
            db.add(models.Defect(
                id=f"{ins_id}-{d_info['id']}",
                inspection_id=ins_id,
                defect_type=d_info["defect_type"],
                severity=d_info["severity"],
                confidence=d_info["confidence"],
                camera_id=d_info["camera_id"],
                surface_face=d_info["surface_face"],
                x_pos_px=d_info["x_pos_px"],
                y_pos_px=d_info["y_pos_px"],
                encoder_pos_mm=d_info.get("encoder_pos_mm", encoder_pos_mm),
                bbox_xywh=d_info["bbox_xywh"],
                length_mm=d_info["length_mm"],
                width_mm=d_info["width_mm"],
                area_mm2=d_info["area_mm2"],
                orientation_deg=d_info["orientation_deg"],
                crop_path=d_info.get("crop_path"),
            ))

        # Add OCR Result
        db.add(models.OCRResult(
            inspection_id=ins_id,
            raw_text=ocr_results["raw_text"],
            parsed_heat_number=ocr_results["heat_number"],
            parsed_batch_id=ocr_results["batch_id"],
            confidence=ocr_results["confidence"],
            bbox=ocr_results["bbox"],
            camera_id="CAM-05",
            engine_name=ocr_results["engine_name"],
        ))

        # Add ECA Indication if detected
        if eca_reading["has_indication"]:
            db.add(models.ECAIndication(
                inspection_id=ins_id,
                billet_id=b_id,
                channel_idx=7,
                signal_amplitude_mv=eca_reading["max_amplitude_mv"],
                phase_deg=88.5,
                encoder_position_mm=round(encoder_pos_mm, 1),
                indication_type=eca_reading["indication_type"],
                severity="MAJOR",
                confidence=0.92,
                is_simulated=True,
            ))

        # Add PAUT Indication if volumetric flaw detected
        if paut_reading["has_internal_flaw"]:
            db.add(models.PAUTIndication(
                inspection_id=ins_id,
                billet_id=b_id,
                channel_idx=32,
                depth_mm=paut_reading["flaw_depth_mm"] or 75.0,
                amplitude_pct=paut_reading["peak_flaw_amplitude_pct"],
                encoder_position_mm=round(encoder_pos_mm, 1),
                indication_type=paut_reading["indication_type"],
                severity="CRITICAL",
                confidence=0.94,
                is_simulated=True,
            ))

        # Add Inspection Stage Logs
        for st in stage_timings:
            db.add(models.InspectionStage(
                inspection_id=ins_id,
                stage_name=st["stage"],
                status=st["status"],
                latency_ms=st["latency_ms"],
                timestamp=datetime.utcnow(),
            ))

        # Add Sensor Events
        db.add(models.SensorEvent(
            inspection_id=ins_id,
            billet_id=b_id,
            sensor_source="CAMERA_01",
            encoder_position_mm=round(encoder_pos_mm, 1),
            event_type="SURFACE_OPTICAL_CAPTURE",
            data={"defects_count": len(defects), "fps": 60},
        ))
        db.add(models.SensorEvent(
            inspection_id=ins_id,
            billet_id=b_id,
            sensor_source="ECA_PROBE_01",
            encoder_position_mm=round(encoder_pos_mm, 1),
            event_type="ECA_SWEEP_ACQUIRED",
            data={"amplitude_mv": eca_reading["max_amplitude_mv"], "is_simulated": True},
        ))

        # Add Audit Event
        db.add(models.AuditEvent(
            inspection_id=ins_id,
            action="INSPECTION_CREATED",
            actor_id="AI_PIPELINE_DAEMON",
            details={"rules": rules_triggered, "latency_ms": total_latency_ms, "coverage_bottom": "NOT_INSPECTED"},
            audit_hash_snapshot=curr_audit_hash,
            timestamp=datetime.utcnow(),
        ))

        db.commit()

        # Stage 14: PLC Output Communication
        plc_service.write_disposition(
            billet_id=b_id,
            disposition=status,
            actuator_id="DIVERT_01",
        )

        # Stage 15: Complete Tracker Session
        billet_tracker.mark_completed(tracking_session.session_id)

        # Stage 16: Real-Time WebSocket Broadcast
        inspection_data = {
            "id": ins_id,
            "billet_id": b_id,
            "heat_number": heat_no,
            "batch_id": batch_no,
            "timestamp": inspection_rec.timestamp.isoformat(),
            "status": status,
            "decision_reason": reason,
            "why_failed_explanation": why_failed_explanation,
            "coverage_bottom": "NOT_INSPECTED",
            "length_mm": dim_results["length_mm"],
            "width_mm": dim_results["width_mm"],
            "height_mm": dim_results["height_mm"],
            "defect_count": len(defects),
            "ocr_text": ocr_results["raw_text"],
            "ocr_confidence": ocr_results["confidence"],
            "processing_latency_ms": total_latency_ms,
            "evidence_image": evidence_url,
            "audit_hash": curr_audit_hash,
            "defects": defects,
            "dimensions": dim_results["dimension_items"],
            "ndt_fusion": ndt_fusion_summary,
            "laser_3d": laser_profile,
            "stages": stage_timings,
        }
        await manager.broadcast_inspection("INSPECTION_COMPLETED", inspection_data)

        logger.info(f"Multimodal inspection complete: {ins_id} [{status}] ({total_latency_ms} ms)")
        return inspection_data

def Math_round(val: float) -> int:
    return int(round(val))

pipeline_orchestrator = InspectionPipelineOrchestrator()
