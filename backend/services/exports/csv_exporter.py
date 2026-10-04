import csv
from typing import List, Dict, Any
from pathlib import Path

def export_inspections_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports master Billet Inspection records to CSV (billets.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "heat_number", "batch_id", "steel_grade",
        "timestamp", "length_mm", "width_mm", "height_mm", "dimension_status",
        "ocr_text", "ocr_confidence", "defect_count", "status",
        "decision_reason", "why_failed_explanation", "processing_latency_ms",
        "model_version", "calibration_version", "audit_hash", "previous_audit_hash"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            writer.writerow({
                "billet_id": rec.get("billet_id"),
                "inspection_id": rec.get("id"),
                "heat_number": rec.get("heat_number"),
                "batch_id": rec.get("batch_id"),
                "steel_grade": rec.get("steel_grade", "IS 2830 / Fe 500D"),
                "timestamp": str(rec.get("timestamp"))[:19],
                "length_mm": rec.get("length_mm"),
                "width_mm": rec.get("width_mm"),
                "height_mm": rec.get("height_mm"),
                "dimension_status": rec.get("dimension_status", "PASS"),
                "ocr_text": rec.get("ocr_text"),
                "ocr_confidence": rec.get("ocr_confidence"),
                "defect_count": rec.get("defect_count", 0),
                "status": rec.get("status"),
                "decision_reason": rec.get("decision_reason"),
                "why_failed_explanation": rec.get("why_failed_explanation", rec.get("decision_reason")),
                "processing_latency_ms": rec.get("processing_latency_ms"),
                "model_version": rec.get("model_version"),
                "calibration_version": rec.get("calibration_version"),
                "audit_hash": rec.get("audit_hash"),
                "previous_audit_hash": rec.get("previous_audit_hash"),
            })
    return output_path

def export_defects_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports master defect table with physical positions to CSV (defects.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "defect_id", "defect_type", "sensor_source",
        "surface_face", "position_from_front_mm", "position_from_back_mm",
        "x_pos_px", "y_pos_px", "length_mm", "width_mm", "area_mm2",
        "orientation_deg", "severity", "confidence", "crop_path", "final_status"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            b_len = rec.get("length_mm", 6000.0)
            for d in rec.get("defects", []):
                pos_f = d.get("position_from_front_mm", d.get("encoder_pos_mm", 0.0))
                pos_b = d.get("position_from_back_mm", max(0.0, b_len - pos_f))
                sev = d.get("severity", "MAJOR")
                writer.writerow({
                    "billet_id": rec.get("billet_id"),
                    "inspection_id": rec.get("id"),
                    "defect_id": d.get("id"),
                    "defect_type": d.get("defect_type"),
                    "sensor_source": "Optical Camera (CAM-01)",
                    "surface_face": d.get("surface_face", "TOP"),
                    "position_from_front_mm": round(pos_f, 1),
                    "position_from_back_mm": round(pos_b, 1),
                    "x_pos_px": d.get("x_pos_px", 0),
                    "y_pos_px": d.get("y_pos_px", 0),
                    "length_mm": d.get("length_mm"),
                    "width_mm": d.get("width_mm"),
                    "area_mm2": d.get("area_mm2"),
                    "orientation_deg": d.get("orientation_deg", 0.0),
                    "severity": sev,
                    "confidence": d.get("confidence"),
                    "crop_path": d.get("crop_path"),
                    "final_status": "REJECT" if sev in ["CRITICAL", "MAJOR"] else "REVIEW",
                })
    return output_path

def export_eca_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports Eddy Current Array indication telemetry to CSV (eca_indications.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "timestamp", "encoder_position_mm",
        "position_from_front_mm", "surface_face", "channel_idx", "affected_channels",
        "signal_amplitude_mv", "threshold_mv", "signal_threshold_ratio",
        "indication_type", "severity", "confidence", "assessment", "is_simulated"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            ts = str(rec.get("timestamp"))[:19]
            eca_items = rec.get("eca_indications", [])
            if not eca_items and rec.get("defect_count", 0) > 0:
                eca_items = [{
                    "channel_idx": 7,
                    "signal_amplitude_mv": 296.0,
                    "threshold_mv": 120.0,
                    "encoder_position_mm": 650.0,
                    "indication_type": "SURFACE_CRACK_IMPEDANCE",
                    "severity": "MAJOR",
                    "confidence": 0.92,
                    "is_simulated": True,
                }]
            elif not eca_items:
                eca_items = [{
                    "channel_idx": 1,
                    "signal_amplitude_mv": 12.0,
                    "threshold_mv": 120.0,
                    "encoder_position_mm": 0.0,
                    "indication_type": "NORMAL_IMPEDANCE",
                    "severity": "NORMAL",
                    "confidence": 0.99,
                    "is_simulated": True,
                }]

            for e in eca_items:
                amp = e.get("signal_amplitude_mv", 12.0)
                thresh = e.get("threshold_mv", 120.0)
                pos_f = e.get("encoder_position_mm", 0.0)
                ch = e.get("channel_idx", 1)
                aff_ch = f"Ch {max(1, ch-1)}-Ch {min(16, ch+1)}" if amp >= thresh else "Ch 1-16 Baseline"
                assm = "Surface Crack Indication" if amp >= thresh else "No Flaw Indication"

                writer.writerow({
                    "billet_id": rec.get("billet_id"),
                    "inspection_id": rec.get("id"),
                    "timestamp": ts,
                    "encoder_position_mm": pos_f,
                    "position_from_front_mm": pos_f,
                    "surface_face": "TOP",
                    "channel_idx": ch,
                    "affected_channels": aff_ch,
                    "signal_amplitude_mv": amp,
                    "threshold_mv": thresh,
                    "signal_threshold_ratio": round(amp / max(thresh, 1.0), 2),
                    "indication_type": "Surface Crack Indication" if amp >= thresh else "Normal Impedance",
                    "severity": e.get("severity", "NORMAL"),
                    "confidence": e.get("confidence", 0.92),
                    "assessment": assm,
                    "is_simulated": True,
                })
    return output_path

def export_paut_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports Phased Array Ultrasonic Testing telemetry to CSV (paut_indications.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "timestamp", "encoder_position_mm",
        "position_from_front_mm", "depth_mm", "position_from_back_mm",
        "amplitude_pct", "threshold_pct", "probe_channel", "scan_direction",
        "indication_length", "indication_width", "assessment", "is_simulated"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            ts = str(rec.get("timestamp"))[:19]
            b_len = rec.get("length_mm", 6000.0)
            paut_items = rec.get("paut_indications", [])
            if not paut_items and rec.get("status") == "FAIL":
                paut_items = [{
                    "channel_idx": 32,
                    "depth_mm": 75.0,
                    "amplitude_pct": 68.0,
                    "encoder_position_mm": 4400.0,
                    "indication_type": "INTERNAL_CORE_POROSITY",
                    "severity": "CRITICAL",
                    "confidence": 0.94,
                    "is_simulated": True,
                }]
            elif not paut_items:
                paut_items = [{
                    "channel_idx": 32,
                    "depth_mm": "NOT APPLICABLE",
                    "amplitude_pct": 8.0,
                    "encoder_position_mm": 0.0,
                    "indication_type": "UNIFORM_CORE",
                    "severity": "NORMAL",
                    "confidence": 0.98,
                    "is_simulated": True,
                }]

            for p in paut_items:
                amp = p.get("amplitude_pct", p.get("amplitude", 8.0))
                depth = p.get("depth_mm", "NOT MEASURED")
                pos_f = p.get("encoder_position_mm", 0.0)
                pos_b = max(0.0, b_len - pos_f) if isinstance(pos_f, (int, float)) else "N/A"
                assm = "Potential Internal Indication" if amp >= 35.0 else "Uniform Sound Core"

                writer.writerow({
                    "billet_id": rec.get("billet_id"),
                    "inspection_id": rec.get("id"),
                    "timestamp": ts,
                    "encoder_position_mm": pos_f,
                    "position_from_front_mm": pos_f,
                    "depth_mm": depth,
                    "position_from_back_mm": pos_b,
                    "amplitude_pct": amp,
                    "threshold_pct": 35.0,
                    "probe_channel": f"PAUT-01 (Ch {p.get('channel_idx', 32)})",
                    "scan_direction": "Longitudinal Axis",
                    "indication_length": "NOT MEASURED",
                    "indication_width": "NOT MEASURED",
                    "assessment": assm,
                    "is_simulated": True,
                })
    return output_path

def export_measurements_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports dimensional metrology measurements to CSV (measurements.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "timestamp", "dimension_name",
        "measured_value_mm", "nominal_mm", "expected_min_mm", "expected_max_mm",
        "deviation_mm", "deviation_pct", "status", "camera_id"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            ts = str(rec.get("timestamp"))[:19]
            dims = rec.get("dimensions", [])
            if not dims:
                l_val = rec.get("length_mm", 6000.0)
                w_val = rec.get("width_mm", 150.0)
                h_val = rec.get("height_mm", 150.0)
                def_dims = [
                    ("Length", l_val, 6000.0, 5800.0, 6200.0, round(l_val-6000.0, 1), round(((l_val-6000.0)/6000.0)*100, 2), "PASS" if abs(l_val-6000.0)<=200 else "FAIL"),
                    ("Width", w_val, 150.0, 147.0, 153.0, round(w_val-150.0, 1), round(((w_val-150.0)/150.0)*100, 2), "PASS" if abs(w_val-150.0)<=3 else "FAIL"),
                    ("Height", h_val, 150.0, 147.0, 153.0, round(h_val-150.0, 1), round(((h_val-150.0)/150.0)*100, 2), "PASS" if abs(h_val-150.0)<=3 else "FAIL"),
                ]
                for pname, meas, nom, emin, emax, dev_mm, dev_pct, st in def_dims:
                    writer.writerow({
                        "billet_id": rec.get("billet_id"),
                        "inspection_id": rec.get("id"),
                        "timestamp": ts,
                        "dimension_name": pname,
                        "measured_value_mm": meas,
                        "nominal_mm": nom,
                        "expected_min_mm": emin,
                        "expected_max_mm": emax,
                        "deviation_mm": dev_mm,
                        "deviation_pct": dev_pct,
                        "status": st,
                        "camera_id": "CAM-01 / Metrology",
                    })
            else:
                for d in dims:
                    nom = d.get("nominal_mm", 6000.0)
                    meas = d.get("measured_value_mm", nom)
                    writer.writerow({
                        "billet_id": rec.get("billet_id"),
                        "inspection_id": rec.get("id"),
                        "timestamp": ts,
                        "dimension_name": str(d.get("dimension_name", "Dimension")).capitalize(),
                        "measured_value_mm": meas,
                        "nominal_mm": nom,
                        "expected_min_mm": d.get("expected_min_mm", nom-10),
                        "expected_max_mm": d.get("expected_max_mm", nom+10),
                        "deviation_mm": round(meas - nom, 2),
                        "deviation_pct": d.get("deviation_pct", 0.0),
                        "status": d.get("status", "PASS"),
                        "camera_id": d.get("camera_id", "CAM-01"),
                    })
    return output_path

def export_audit_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports cryptographic SHA-256 audit ledger events to CSV (audit.csv)."""
    fieldnames = [
        "billet_id", "inspection_id", "timestamp", "action", "actor_id",
        "audit_hash", "previous_audit_hash", "model_version", "calibration_version",
        "processing_latency_ms"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            writer.writerow({
                "billet_id": rec.get("billet_id"),
                "inspection_id": rec.get("id"),
                "timestamp": str(rec.get("timestamp"))[:19],
                "action": "INSPECTION_COMPLETED_AND_FUSED",
                "actor_id": "SYSTEM_PIPELINE_ORCHESTRATOR",
                "audit_hash": rec.get("audit_hash"),
                "previous_audit_hash": rec.get("previous_audit_hash", "GENESIS_HASH"),
                "model_version": rec.get("model_version"),
                "calibration_version": rec.get("calibration_version"),
                "processing_latency_ms": rec.get("processing_latency_ms"),
            })
    return output_path
