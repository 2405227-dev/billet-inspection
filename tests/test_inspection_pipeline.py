import pytest
import os
import cv2
import numpy as np
from pathlib import Path

from backend.core.config import settings
from backend.core.database import SessionLocal, init_db
from backend.core.security import calculate_audit_hash, verify_audit_chain, GENESIS_HASH
from backend.models_db import models
from backend.services.camera.provider import DemoCameraProvider, camera_manager
from backend.services.tracking.tracker import BilletTracker, BilletState
from backend.services.metrology.metrology_engine import metrology_engine
from backend.services.defect.defect_engine import defect_engine
from backend.services.ocr.ocr_engine import ocr_engine
from backend.services.decision.decision_engine import decision_engine
from backend.services.exports.excel_exporter import export_audit_excel
from backend.services.exports.csv_exporter import export_inspections_csv
from backend.services.exports.pdf_exporter import generate_individual_billet_pdf, generate_batch_audit_pdf

@pytest.fixture(scope="module")
def setup_db():
    settings.ensure_directories()
    init_db()
    db = SessionLocal()
    yield db
    db.close()

def test_camera_generation():
    cam = DemoCameraProvider("CAM-01", {"resolution": {"width": 1280, "height": 720}, "fps": 30})
    cam.connect()
    frame = cam.capture_frame(defect_type="longitudinal_crack", heat_number="HEAT-26A-1042")
    assert frame is not None
    assert frame.image.shape == (720, 1280, 3)
    assert cam.is_connected is True

def test_metrology_measurement():
    img = np.zeros((720, 1280, 3), dtype=np.uint8)
    cv2.rectangle(img, (100, 200), (1180, 520), (150, 150, 150), -1)
    res = metrology_engine.measure_billet_dimensions(img, camera_id="CAM-01")
    assert "length_mm" in res
    assert "width_mm" in res
    assert "status" in res
    assert res["status"] == "PASS"

def test_defect_segmentation():
    cam = DemoCameraProvider("CAM-01", {"resolution": {"width": 1280, "height": 720}})
    cam.connect()
    frame = cam.capture_frame(defect_type="longitudinal_crack")
    defects, mask, crops = defect_engine.detect_and_segment_defects(frame.image, camera_id="CAM-01")
    assert isinstance(defects, list)
    assert mask.shape == frame.image.shape

def test_ocr_extraction():
    cam = DemoCameraProvider("CAM-01", {"resolution": {"width": 1280, "height": 720}})
    cam.connect()
    frame = cam.capture_frame(heat_number="HEAT-26A-1042", batch_id="BATCH-104")
    ocr_res = ocr_engine.read_markings(frame.image)
    assert ocr_res["heat_number"] is not None
    assert ocr_res["confidence"] > 0.80

def test_decision_engine():
    # Test PASS scenario
    dims = {"status": "PASS", "dimension_items": []}
    defects = []
    ocr = {"confidence": 0.95, "heat_number": "26A-1042"}
    ndt = {"fusion_status": "CONCORDANT", "subsurface_defects": []}
    status, reason, rules, alerts = decision_engine.evaluate(dims, defects, ocr, ndt)
    assert status == "PASS"

    # Test Critical Crack scenario -> FAIL
    crit_defects = [{"defect_type": "longitudinal_crack", "severity": "CRITICAL", "length_mm": 65.0, "confidence": 0.95}]
    status, reason, rules, alerts = decision_engine.evaluate(dims, crit_defects, ocr, ndt)
    assert status == "FAIL"

def test_duplicate_billet_prevention():
    tracker = BilletTracker()
    sess1 = tracker.register_or_get_billet("BILLET-TEST-01", "26A-1042", "BATCH-104", frame_idx=1)
    sess2 = tracker.register_or_get_billet("BILLET-TEST-01", "26A-1042", "BATCH-104", frame_idx=2)
    # Should associate to same session
    assert sess1.session_id == sess2.session_id
    tracker.mark_completed(sess1.session_id)
    # Re-entry within sliding window
    sess3 = tracker.register_or_get_billet("BILLET-TEST-01", "26A-1042", "BATCH-104", frame_idx=3)
    assert sess3.is_completed is True

def test_audit_hash_chaining():
    record1 = {"inspection_id": "INS-001", "status": "PASS", "billet_id": "B1"}
    h1 = calculate_audit_hash(GENESIS_HASH, record1)
    record2 = {"inspection_id": "INS-002", "status": "FAIL", "billet_id": "B2"}
    h2 = calculate_audit_hash(h1, record2)

    chain = [
        {"inspection_id": "INS-001", "status": "PASS", "billet_id": "B1", "audit_hash": h1, "previous_audit_hash": GENESIS_HASH},
        {"inspection_id": "INS-002", "status": "FAIL", "billet_id": "B2", "audit_hash": h2, "previous_audit_hash": h1},
    ]
    is_valid, count, msg = verify_audit_chain(chain)
    assert is_valid is True
    assert count == 2

    # Tamper test
    chain[0]["status"] = "FAIL" # Tamper record
    is_valid_tampered, fail_idx, msg_tampered = verify_audit_chain(chain)
    assert is_valid_tampered is False
    assert fail_idx == 0

def test_exports_and_reports(setup_db):
    db = setup_db
    sample_records = [
        {
            "id": "INS-2026-TEST01",
            "billet_id": "BILLET-001",
            "heat_number": "26A-1042",
            "batch_id": "BATCH-104",
            "timestamp": "2026-10-03 12:00:00",
            "status": "PASS",
            "decision_reason": "Clean inspection",
            "length_mm": 6002.0,
            "width_mm": 150.1,
            "height_mm": 149.9,
            "dimension_status": "PASS",
            "ocr_text": "HEAT-26A-1042",
            "ocr_confidence": 0.95,
            "defect_count": 0,
            "processing_latency_ms": 142.0,
            "model_version": "v3.2.0",
            "calibration_version": "v4",
            "audit_hash": "a1b2c3d4e5f67890",
            "previous_audit_hash": GENESIS_HASH,
            "defects": [],
        }
    ]
    
    # Test Excel
    excel_path = settings.EXPORTS_PATH / "test_export.xlsx"
    export_audit_excel(sample_records, excel_path)
    assert excel_path.exists()
    assert excel_path.stat().st_size > 0

    # Test CSV
    csv_path = settings.EXPORTS_PATH / "test_export.csv"
    export_inspections_csv(sample_records, csv_path)
    assert csv_path.exists()

    # Test PDF Single
    pdf_path = settings.REPORTS_PATH / "test_report.pdf"
    generate_individual_billet_pdf(sample_records[0], pdf_path)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 0

    # Test PDF Batch
    batch_pdf_path = settings.REPORTS_PATH / "test_batch.pdf"
    generate_batch_audit_pdf(sample_records, batch_pdf_path)
    assert batch_pdf_path.exists()
    assert batch_pdf_path.stat().st_size > 0

def test_canonical_paut_indication_event():
    from backend.hardware.adapters.demo_paut import paut_service
    
    # Acquire volumetric slice with flaw injection
    billet_id = "BILLET-TEST-7788"
    pos = 4200.0
    flaw_depth = 75.0
    
    slice_data = paut_service.acquire_volumetric_slice(
        encoder_pos_mm=pos,
        inject_internal_flaw_at_mm=pos,
        flaw_depth_mm=flaw_depth,
        billet_id=billet_id,
    )
    
    # Must contain canonical paut_indication object
    assert "paut_indication" in slice_data
    ind = slice_data["paut_indication"]
    
    # Assert all required canonical schema keys
    assert ind["billet_id"] == billet_id
    assert ind["encoder_position_mm"] == pos
    assert ind["depth_mm"] == flaw_depth
    assert isinstance(ind["amplitude"], float)
    assert ind["amplitude"] >= 40.0 # Rejection threshold
    assert ind["channel"] == 32
    assert isinstance(ind["timestamp"], float)
    
    # Assert derived A-scan reflections derive from this EXACT object without random deviation
    a_scans = slice_data["a_scan_samples"]
    internal_echo = next(s for s in a_scans if s["label"] == "INTERNAL_INDICATION")
    assert internal_echo["depth_mm"] == ind["depth_mm"]
    assert internal_echo["amplitude_pct"] == ind["amplitude"]
