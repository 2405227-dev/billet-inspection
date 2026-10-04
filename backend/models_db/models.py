from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Plant(Base):
    __tablename__ = "plants"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    location = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    production_lines = relationship("ProductionLine", back_populates="plant")
    inspections = relationship("Inspection", back_populates="plant")

class ProductionLine(Base):
    __tablename__ = "production_lines"
    id = Column(String(64), primary_key=True)
    plant_id = Column(String(64), ForeignKey("plants.id"), nullable=False)
    name = Column(String(128), nullable=False)
    conveyor_speed_m_per_s = Column(Float, default=0.85)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    plant = relationship("Plant", back_populates="production_lines")
    inspections = relationship("Inspection", back_populates="production_line")

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    position = Column(String(32), nullable=False) # TOP, BOTTOM, LEFT, RIGHT, END_FACE
    orientation = Column(String(64))
    camera_type = Column(String(64)) # GigE_AREA_SCAN, GigE_LINE_SCAN, USB3
    sensor_model = Column(String(128))
    resolution_w = Column(Integer, default=4096)
    resolution_h = Column(Integer, default=2160)
    fps = Column(Integer, default=60)
    exposure_us = Column(Integer, default=1200)
    gain_db = Column(Float, default=4.0)
    lighting_profile = Column(String(128))
    is_active = Column(Boolean, default=True)

class Calibration(Base):
    __tablename__ = "calibrations"
    id = Column(String(64), primary_key=True)
    camera_id = Column(String(64), ForeignKey("cameras.id"), nullable=False)
    version = Column(String(32), nullable=False)
    pixel_to_mm_ratio = Column(Float, nullable=False)
    distortion_coefficients = Column(JSON, default={})
    homography_matrix = Column(JSON, default=[])
    measurement_uncertainty_mm = Column(Float, default=0.15)
    calibrated_at = Column(DateTime, default=datetime.utcnow)
    calibrated_by = Column(String(64), default="SYSTEM_AUTO_CAL")
    is_active = Column(Boolean, default=True)

class Operator(Base):
    __tablename__ = "operators"
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    badge_number = Column(String(64), unique=True)
    role = Column(String(64), default="QUALITY_INSPECTOR")
    shift = Column(String(32), default="SHIFT_A")
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(String(64), primary_key=True)
    model_type = Column(String(64), nullable=False) # DETECTOR, SEGMENTATION, OCR, ANOMALY
    name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    framework = Column(String(64), default="ONNXRuntime")
    accuracy_metric = Column(JSON, default={})
    is_deployed = Column(Boolean, default=True)
    deployed_at = Column(DateTime, default=datetime.utcnow)

class Billet(Base):
    __tablename__ = "billets"
    id = Column(String(64), primary_key=True) # e.g. BILLET-06128
    heat_number = Column(String(64), index=True)
    batch_id = Column(String(64), index=True)
    steel_grade = Column(String(64), default="IS 2830 / Fe 500D")
    nominal_length_mm = Column(Float, default=6000.0)
    nominal_section_mm = Column(Float, default=150.0)
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    
    inspections = relationship("Inspection", back_populates="billet")

class Inspection(Base):
    __tablename__ = "inspections"
    
    # Primary Key
    id = Column(String(64), primary_key=True) # e.g. INS-2026-000001
    
    # Foreign Keys & Linkages
    billet_id = Column(String(64), ForeignKey("billets.id"), nullable=False, index=True)
    plant_id = Column(String(64), ForeignKey("plants.id"), nullable=True)
    production_line_id = Column(String(64), ForeignKey("production_lines.id"), nullable=True)
    
    # Metadata
    heat_number = Column(String(64), index=True, nullable=False)
    batch_id = Column(String(64), index=True, nullable=False)
    camera_ids = Column(JSON, default=[]) # CAM-01, CAM-02, CAM-03, CAM-04, CAM-05
    
    # Encoder Synchronized Traversal
    encoder_entry_position_mm = Column(Float, default=0.0)
    encoder_exit_position_mm = Column(Float, default=6000.0)
    conveyor_speed_mm_s = Column(Float, default=1000.0)
    
    # Multi-Face Physical Surface Coverage Map
    coverage_top = Column(String(32), default="INSPECTED")
    coverage_bottom = Column(String(32), default="NOT_INSPECTED") # Physical conveyor contact surface
    coverage_left = Column(String(32), default="INSPECTED")
    coverage_right = Column(String(32), default="INSPECTED")
    coverage_front = Column(String(32), default="INSPECTED")
    coverage_back = Column(String(32), default="INSPECTED")
    
    # Dimensional Metrology
    length_mm = Column(Float, nullable=False)
    width_mm = Column(Float, nullable=False)
    height_mm = Column(Float, nullable=False)
    diameter_mm = Column(Float, nullable=True)
    dimension_deviation_pct = Column(Float, default=0.0)
    dimension_status = Column(String(32), default="PASS") # PASS / FAIL
    
    # OCR & Markings
    ocr_text = Column(String(128), nullable=True)
    ocr_confidence = Column(Float, default=0.0)
    barcode_value = Column(String(128), nullable=True)
    barcode_type = Column(String(32), nullable=True)
    
    # Defect Summary
    defect_count = Column(Integer, default=0)
    has_critical_defect = Column(Boolean, default=False)
    has_major_defect = Column(Boolean, default=False)
    
    # Quality Decision & Transparent Root-Cause Explanation
    status = Column(String(32), nullable=False, index=True) # PASS, FAIL, REWORK, NEEDS_REVIEW
    decision_reason = Column(Text, nullable=False)
    why_failed_explanation = Column(Text, nullable=True)
    rules_triggered = Column(JSON, default=[])
    
    # System & Execution Metrics
    processing_latency_ms = Column(Float, default=0.0)
    model_version = Column(String(64), default="surface-defect-ensemble-seg:v3.2.0")
    calibration_version = Column(String(64), default="CALIB-CAM01-2026-v4")
    
    # Human in the loop review
    operator_override = Column(Boolean, default=False)
    operator_id = Column(String(64), ForeignKey("operators.id"), nullable=True)
    operator_decision = Column(String(32), nullable=True)
    operator_comment = Column(Text, nullable=True)
    review_status = Column(String(32), default="NOT_REQUIRED") # NOT_REQUIRED, PENDING, REVIEWED
    
    # Stored Evidence File References
    evidence_image = Column(String(256), nullable=False)
    raw_frame_reference = Column(String(256), nullable=True)
    defect_crop_references = Column(JSON, default=[])
    segmentation_mask_reference = Column(String(256), nullable=True)
    ocr_crop_reference = Column(String(256), nullable=True)
    
    # Sensor Fusion / NDT Snapshot
    ndt_results = Column(JSON, default={})
    
    # Cryptographic Audit Trail
    audit_hash = Column(String(64), nullable=False, unique=True, index=True)
    previous_audit_hash = Column(String(64), nullable=False)
    
    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    billet = relationship("Billet", back_populates="inspections")
    plant = relationship("Plant", back_populates="inspections")
    production_line = relationship("ProductionLine", back_populates="inspections")
    defects = relationship("Defect", back_populates="inspection", cascade="all, delete-orphan")
    dimensions = relationship("Dimension", back_populates="inspection", cascade="all, delete-orphan")
    ocr_results = relationship("OCRResult", back_populates="inspection", cascade="all, delete-orphan")
    eca_indications = relationship("ECAIndication", back_populates="inspection", cascade="all, delete-orphan")
    paut_indications = relationship("PAUTIndication", back_populates="inspection", cascade="all, delete-orphan")
    sensor_events = relationship("SensorEvent", back_populates="inspection", cascade="all, delete-orphan")
    inspection_stages = relationship("InspectionStage", back_populates="inspection", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="inspection")
    audit_events = relationship("AuditEvent", back_populates="inspection")

class Defect(Base):
    __tablename__ = "defects"
    id = Column(String(64), primary_key=True) # e.g. DEF-INS001-01
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    defect_type = Column(String(64), nullable=False, index=True) # longitudinal_crack, transverse_crack, etc.
    severity = Column(String(32), nullable=False) # CRITICAL, MAJOR, MODERATE, MINOR, UNKNOWN
    confidence = Column(Float, nullable=False)
    camera_id = Column(String(64), default="CAM-01")
    surface_face = Column(String(32), default="TOP") # TOP, BOTTOM (NOT_INSPECTED), LEFT, RIGHT, FRONT, BACK
    
    # Defect Metrology & Spatial Location
    x_pos_px = Column(Integer, default=0)
    y_pos_px = Column(Integer, default=0)
    encoder_pos_mm = Column(Float, default=0.0) # Physical distance along billet length
    bbox_xywh = Column(JSON, default=[])
    length_mm = Column(Float, default=0.0)
    width_mm = Column(Float, default=0.0)
    area_mm2 = Column(Float, default=0.0)
    orientation_deg = Column(Float, default=0.0)
    
    # Evidence Paths
    crop_path = Column(String(256), nullable=True)
    mask_path = Column(String(256), nullable=True)
    
    inspection = relationship("Inspection", back_populates="defects")

class Dimension(Base):
    __tablename__ = "dimensions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    dimension_name = Column(String(32), nullable=False) # length, width, height, diagonal
    measured_value_mm = Column(Float, nullable=False)
    expected_min_mm = Column(Float, nullable=False)
    expected_max_mm = Column(Float, nullable=False)
    nominal_mm = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    status = Column(String(16), default="PASS") # PASS / FAIL
    camera_id = Column(String(64), default="CAM-01")
    
    inspection = relationship("Inspection", back_populates="dimensions")

class OCRResult(Base):
    __tablename__ = "ocr_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    raw_text = Column(String(128), nullable=False)
    parsed_heat_number = Column(String(64), nullable=True)
    parsed_batch_id = Column(String(64), nullable=True)
    confidence = Column(Float, nullable=False)
    bbox = Column(JSON, default=[])
    camera_id = Column(String(64), default="CAM-05")
    engine_name = Column(String(64), default="PaddleOCR / Tesseract Fallback")
    
    inspection = relationship("Inspection", back_populates="ocr_results")

class ECAIndication(Base):
    __tablename__ = "eca_indications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    billet_id = Column(String(64), index=True)
    channel_idx = Column(Integer, nullable=False)
    signal_amplitude_mv = Column(Float, nullable=False)
    phase_deg = Column(Float, default=0.0)
    encoder_position_mm = Column(Float, nullable=False)
    indication_type = Column(String(64), default="SURFACE_CRACK_IMPEDANCE")
    severity = Column(String(32), default="MAJOR")
    confidence = Column(Float, default=0.92)
    is_simulated = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="eca_indications")

class PAUTIndication(Base):
    __tablename__ = "paut_indications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    billet_id = Column(String(64), index=True)
    channel_idx = Column(Integer, default=0)
    depth_mm = Column(Float, nullable=False)
    amplitude_pct = Column(Float, nullable=False)
    encoder_position_mm = Column(Float, nullable=False)
    indication_type = Column(String(64), default="INTERNAL_CORE_POROSITY")
    severity = Column(String(32), default="CRITICAL")
    confidence = Column(Float, default=0.94)
    is_simulated = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="paut_indications")

class SensorEvent(Base):
    __tablename__ = "sensor_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    billet_id = Column(String(64), index=True)
    sensor_source = Column(String(32), nullable=False) # CAMERA, LASER_3D, OCR, ECA, PAUT, ENCODER, PLC
    encoder_position_mm = Column(Float, nullable=False)
    event_type = Column(String(64), nullable=False)
    data = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="sensor_events")

class InspectionStage(Base):
    __tablename__ = "inspection_stages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    stage_name = Column(String(32), nullable=False) # ACQUIRE, DETECT, TRACK, POSITION, METROLOGY, OCR, SURFACE, ECA, PAUT, FUSION, DECISION, LOG
    status = Column(String(32), default="DONE") # DONE, SIMULATED, SKIPPED, ERROR
    latency_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="inspection_stages")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(64), primary_key=True) # ALT-2026-0001
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=True, index=True)
    alert_type = Column(String(64), nullable=False) # CRITICAL_DEFECT, DIMENSION_OUT_OF_TOLERANCE, etc.
    severity = Column(String(32), nullable=False) # CRITICAL, MAJOR, MODERATE, MINOR
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, default={})
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    inspection = relationship("Inspection", back_populates="alerts")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    inspection_id = Column(String(64), ForeignKey("inspections.id"), nullable=False, index=True)
    action = Column(String(64), nullable=False) # CREATED, REVIEWED, OVERRIDDEN, EXPORTED, INTEGRITY_CHECK
    actor_id = Column(String(64), default="SYSTEM")
    details = Column(JSON, default={})
    audit_hash_snapshot = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="audit_events")

# Multi-column indexes for fast audit and search lookups
Index("idx_inspections_heat_status", Inspection.heat_number, Inspection.status)
Index("idx_inspections_timestamp_status", Inspection.timestamp, Inspection.status)
