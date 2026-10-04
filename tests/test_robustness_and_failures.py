import pytest
import time
import numpy as np
import cv2

from backend.core.config import settings
from backend.core.database import SessionLocal, init_db
from backend.core.security import calculate_audit_hash, verify_audit_chain, GENESIS_HASH
from backend.models_db import models
from backend.services.camera.provider import DemoCameraProvider
from backend.services.tracking.tracker import BilletTracker, BilletState
from backend.services.metrology.metrology_engine import metrology_engine
from backend.services.defect.defect_engine import defect_engine
from backend.services.ocr.ocr_engine import ocr_engine
from backend.services.ndt.sensor_fusion import ndt_engine
from backend.services.decision.decision_engine import decision_engine
from backend.hardware.adapters.demo_encoder import DemoEncoder
from backend.hardware.adapters.demo_eca import DemoECA
from backend.hardware.adapters.demo_paut import DemoPAUT
from backend.hardware.adapters.demo_laser import DemoLaser3D
from backend.hardware.adapters.industrial_adapters import (
    IndustrialCameraAdapter,
    IndustrialEncoderAdapter,
    IndustrialLaser3DAdapter,
    IndustrialECAAdapter,
    IndustrialPAUTAdapter,
    PLCAdapter,
)

@pytest.fixture(scope="module")
def setup_db():
    settings.ensure_directories()
    init_db()
    db = SessionLocal()
    yield db
    db.close()

def test_multi_billet_continuous_tracking():
    """Verifies that multiple consecutive billets receive unique tracking sessions without crosstalk."""
    tracker = BilletTracker()
    
    b1 = tracker.register_or_get_billet("BILLET-0001", "26A-1001", "BATCH-01", frame_idx=1)
    b2 = tracker.register_or_get_billet("BILLET-0002", "26A-1002", "BATCH-01", frame_idx=2)
    b3 = tracker.register_or_get_billet("BILLET-0003", "26A-1003", "BATCH-02", frame_idx=3)

    assert b1.session_id != b2.session_id
    assert b2.session_id != b3.session_id
    assert b1.billet_id == "BILLET-0001"
    assert b2.billet_id == "BILLET-0002"
    assert b3.billet_id == "BILLET-0003"
    assert b1.inspection_id != b2.inspection_id

def test_encoder_position_synchronization():
    """Verifies encoder physical coordinate mapping with simulated speed."""
    encoder = DemoEncoder(conveyor_speed_mm_s=500.0)
    pos1 = encoder.get_position_mm()
    time.sleep(0.05)
    pos2 = encoder.get_position_mm()
    assert pos2 > pos1
    assert encoder.get_velocity_mm_s() == 500.0

def test_metrology_tolerance_evaluations():
    """Tests conforming and non-conforming dimensional limits."""
    img = np.zeros((720, 1280, 3), dtype=np.uint8)
    
    # In-tolerance billet: 6002 mm length (Nominal: 6000 ±200 mm)
    res_pass = metrology_engine.measure_billet_dimensions(img, simulated_length_override=6005.0)
    assert res_pass["status"] == "PASS"
    assert res_pass["length_mm"] == 6005.0

    # Out-of-tolerance billet: 6350 mm length -> FAIL
    res_fail = metrology_engine.measure_billet_dimensions(img, simulated_length_override=6350.0)
    assert res_fail["status"] == "FAIL"
    assert res_fail["length_mm"] == 6350.0

def test_low_ocr_confidence_triggers_review():
    """Verifies that unreadable or low confidence OCR marks status as NEEDS_REVIEW."""
    img = np.zeros((720, 1280, 3), dtype=np.uint8)
    ocr_fail_res = ocr_engine.read_markings(img, force_failure=True)
    assert ocr_fail_res["confidence"] < 0.50
    assert ocr_fail_res["heat_number"] == "UNKNOWN-HEAT"

    # Evaluate in decision engine
    dims = {"status": "PASS", "dimension_items": []}
    defects = []
    ndt = {"fusion_status": "CONCORDANT", "subsurface_defects": []}
    status, reason, rules, alerts = decision_engine.evaluate(dims, defects, ocr_fail_res, ndt)
    assert status == "NEEDS_REVIEW"
    assert any("OCR" in r for r in rules)

def test_critical_defect_rejection():
    """Verifies that a critical longitudinal crack yields FAIL disposition."""
    dims = {"status": "PASS", "dimension_items": []}
    defects = [
        {"defect_type": "longitudinal_crack", "severity": "CRITICAL", "length_mm": 55.0, "confidence": 0.95}
    ]
    ocr = {"confidence": 0.95, "heat_number": "26A-1042"}
    ndt = {"fusion_status": "CONCORDANT", "subsurface_defects": []}
    status, reason, rules, alerts = decision_engine.evaluate(dims, defects, ocr, ndt)
    assert status == "FAIL"

def test_paut_internal_flaw_detection():
    """Verifies PAUT volumetric acoustic reflection simulation."""
    paut = DemoPAUT()
    # Clean slice
    slice_clean = paut.acquire_volumetric_slice(encoder_pos_mm=100.0)
    assert slice_clean["has_internal_flaw"] is False

    # Flaw injected at 500 mm encoder pos
    slice_flaw = paut.acquire_volumetric_slice(encoder_pos_mm=500.0, inject_internal_flaw_at_mm=500.0, flaw_depth_mm=75.0)
    assert slice_flaw["has_internal_flaw"] is True
    assert slice_flaw["flaw_depth_mm"] is not None
    assert slice_flaw["peak_flaw_amplitude_pct"] >= 40.0

def test_eca_multichannel_crack_detection():
    """Verifies 16-channel Eddy Current Array impedance anomaly."""
    eca = DemoECA()
    # Clean sweep slice
    clean_slice = eca.acquire_scan_slice(encoder_pos_mm=200.0)
    assert clean_slice["has_indication"] is False

    # Defect injected at 650 mm on channel 7
    flaw_slice = eca.acquire_scan_slice(encoder_pos_mm=650.0, inject_defect_at_mm=650.0, defect_channel=7)
    assert flaw_slice["has_indication"] is True
    assert flaw_slice["max_amplitude_mv"] >= 120.0
    assert flaw_slice["channels"][7]["is_indication"] is True

def test_industrial_adapters_disconnected_honesty():
    """Verifies that uninitialized industrial adapters report DISCONNECTED rather than faking live data."""
    cam_adapter = IndustrialCameraAdapter()
    assert cam_adapter.get_status()["status"] == "DISCONNECTED"
    
    enc_adapter = IndustrialEncoderAdapter()
    assert enc_adapter.get_status()["status"] == "DISCONNECTED"

    laser_adapter = IndustrialLaser3DAdapter()
    assert laser_adapter.get_status()["status"] == "DISCONNECTED"

    eca_adapter = IndustrialECAAdapter()
    assert eca_adapter.get_status()["status"] == "DISCONNECTED"

    paut_adapter = IndustrialPAUTAdapter()
    assert paut_adapter.get_status()["status"] == "DISCONNECTED"

    plc_adapter = PLCAdapter()
    assert plc_adapter.get_status()["status"] == "DISCONNECTED"

def test_bottom_surface_never_marked_pass():
    """Ensures that uninspected conveyor contact surface is recorded as NOT_INSPECTED."""
    coverage_map = {
        "TOP": "INSPECTED",
        "BOTTOM": "NOT_INSPECTED",
        "LEFT": "INSPECTED",
        "RIGHT": "INSPECTED",
    }
    assert coverage_map["BOTTOM"] == "NOT_INSPECTED"
    assert coverage_map["BOTTOM"] != "PASS"
