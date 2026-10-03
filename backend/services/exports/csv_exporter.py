import csv
from typing import List, Dict, Any
from pathlib import Path

def export_inspections_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports central inspection table to CSV."""
    fieldnames = [
        "inspection_id", "timestamp", "billet_id", "heat_number", "batch_id",
        "length_mm", "width_mm", "height_mm", "dimension_status",
        "ocr_text", "ocr_confidence", "defect_count", "status",
        "decision_reason", "processing_latency_ms", "model_version",
        "calibration_version", "audit_hash", "previous_audit_hash"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            writer.writerow({
                "inspection_id": rec.get("id"),
                "timestamp": str(rec.get("timestamp")),
                "billet_id": rec.get("billet_id"),
                "heat_number": rec.get("heat_number"),
                "batch_id": rec.get("batch_id"),
                "length_mm": rec.get("length_mm"),
                "width_mm": rec.get("width_mm"),
                "height_mm": rec.get("height_mm"),
                "dimension_status": rec.get("dimension_status", "PASS"),
                "ocr_text": rec.get("ocr_text"),
                "ocr_confidence": rec.get("ocr_confidence"),
                "defect_count": rec.get("defect_count"),
                "status": rec.get("status"),
                "decision_reason": rec.get("decision_reason"),
                "processing_latency_ms": rec.get("processing_latency_ms"),
                "model_version": rec.get("model_version"),
                "calibration_version": rec.get("calibration_version"),
                "audit_hash": rec.get("audit_hash"),
                "previous_audit_hash": rec.get("previous_audit_hash"),
            })
    return output_path

def export_defects_csv(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """Exports granular defect breakdown to CSV."""
    fieldnames = [
        "inspection_id", "billet_id", "defect_id", "defect_type",
        "severity", "confidence", "surface_face", "length_mm",
        "width_mm", "area_mm2", "orientation_deg", "crop_path"
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in inspections:
            for d in rec.get("defects", []):
                writer.writerow({
                    "inspection_id": rec.get("id"),
                    "billet_id": rec.get("billet_id"),
                    "defect_id": d.get("id"),
                    "defect_type": d.get("defect_type"),
                    "severity": d.get("severity"),
                    "confidence": d.get("confidence"),
                    "surface_face": d.get("surface_face", "TOP"),
                    "length_mm": d.get("length_mm"),
                    "width_mm": d.get("width_mm"),
                    "area_mm2": d.get("area_mm2"),
                    "orientation_deg": d.get("orientation_deg"),
                    "crop_path": d.get("crop_path"),
                })
    return output_path
