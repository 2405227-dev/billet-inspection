from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Defect Schemas
class DefectBase(BaseModel):
    id: str
    defect_type: str
    severity: str
    confidence: float
    camera_id: str = "CAM-01"
    surface_face: str = "TOP"
    x_pos_px: int = 0
    y_pos_px: int = 0
    bbox_xywh: List[int] = []
    length_mm: float = 0.0
    width_mm: float = 0.0
    area_mm2: float = 0.0
    orientation_deg: float = 0.0
    crop_path: Optional[str] = None
    mask_path: Optional[str] = None

class DefectCreate(DefectBase):
    pass

class DefectResponse(DefectBase):
    class Config:
        from_attributes = True

# Dimension Schemas
class DimensionBase(BaseModel):
    dimension_name: str
    measured_value_mm: float
    expected_min_mm: float
    expected_max_mm: float
    nominal_mm: float
    deviation_pct: float
    status: str
    camera_id: str = "CAM-01"

class DimensionResponse(DimensionBase):
    id: int
    class Config:
        from_attributes = True

# OCR Schemas
class OCRResultResponse(BaseModel):
    id: int
    raw_text: str
    parsed_heat_number: Optional[str]
    parsed_batch_id: Optional[str]
    confidence: float
    bbox: List[int] = []
    camera_id: str
    engine_name: str
    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    inspection_id: Optional[str]
    alert_type: str
    severity: str
    title: str
    message: str
    details: Dict[str, Any] = {}
    is_acknowledged: bool = False
    timestamp: datetime
    class Config:
        from_attributes = True

# Inspection Schemas
class InspectionSummary(BaseModel):
    id: str
    billet_id: str
    heat_number: str
    batch_id: str
    timestamp: datetime
    status: str
    length_mm: float
    width_mm: float
    height_mm: float
    defect_count: int
    ocr_text: Optional[str]
    ocr_confidence: float
    processing_latency_ms: float
    decision_reason: str
    audit_hash: str
    review_status: str
    class Config:
        from_attributes = True

class InspectionDetail(InspectionSummary):
    plant_id: Optional[str] = None
    production_line_id: Optional[str] = None
    camera_ids: List[str] = []
    diameter_mm: Optional[float] = None
    dimension_deviation_pct: float = 0.0
    dimension_status: str = "PASS"
    barcode_value: Optional[str] = None
    barcode_type: Optional[str] = None
    has_critical_defect: bool = False
    has_major_defect: bool = False
    rules_triggered: List[str] = []
    model_version: str
    calibration_version: str
    operator_override: bool = False
    operator_id: Optional[str] = None
    operator_decision: Optional[str] = None
    operator_comment: Optional[str] = None
    evidence_image: str
    raw_frame_reference: Optional[str] = None
    defect_crop_references: List[str] = []
    segmentation_mask_reference: Optional[str] = None
    ocr_crop_reference: Optional[str] = None
    ndt_results: Dict[str, Any] = {}
    previous_audit_hash: str
    created_at: datetime
    updated_at: datetime
    defects: List[DefectResponse] = []
    dimensions: List[DimensionResponse] = []
    ocr_results: List[OCRResultResponse] = []
    alerts: List[AlertResponse] = []
    class Config:
        from_attributes = True

class OperatorReviewRequest(BaseModel):
    operator_id: str
    decision: str # PASS, REJECT, REWORK
    corrected_ocr_heat: Optional[str] = None
    corrected_defect_type: Optional[str] = None
    comment: str

class AuditVerifyResponse(BaseModel):
    is_valid: bool
    total_records: int
    failing_record_index: Optional[int] = None
    message: str
    verified_at: datetime

class StatsOverviewResponse(BaseModel):
    total_inspections: int
    pass_count: int
    fail_count: int
    rework_count: int
    review_count: int
    pass_rate_pct: float
    active_alerts_count: int
    avg_latency_ms: float
    ocr_success_rate_pct: float
    total_defects_detected: int
    defect_type_breakdown: Dict[str, int]
    status_trend: List[Dict[str, Any]]
