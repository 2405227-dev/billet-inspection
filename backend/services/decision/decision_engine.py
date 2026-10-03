import logging
from typing import Dict, Any, List, Tuple
from backend.core.config import settings

logger = logging.getLogger("billet.decision")

class QualityDecisionEngine:
    """
    Deterministic Industrial Quality Decision & Tolerance Evaluation Engine.
    Maps dimensional compliance, defect severity distributions, OCR confidence gates,
    and NDT sensor fusion into an auditable PASS / FAIL / REWORK / NEEDS_REVIEW outcome with full rationale.
    """
    def evaluate(
        self,
        dimensions: Dict[str, Any],
        defects: List[Dict[str, Any]],
        ocr_result: Dict[str, Any],
        ndt_result: Dict[str, Any],
        calibration_valid: bool = True,
        camera_online: bool = True,
    ) -> Tuple[str, str, List[str], List[Dict[str, Any]]]:
        """
        Executes strict quality gating.
        Returns:
            (status, primary_reason, rules_triggered, generated_alerts)
        """
        rules_triggered = []
        alerts = []

        # 1. System Fail-Safe Checks
        if not camera_online:
            rules_triggered.append("RULE_CAM_OFFLINE: Camera feed disconnected or frame dropped")
            alerts.append({
                "type": "CAMERA_FAILURE",
                "severity": "CRITICAL",
                "title": "Camera Feed Disconnected",
                "message": "Inspection aborted because optical camera stream is offline.",
            })
            return "NEEDS_REVIEW", "System Error: Camera offline during acquisition.", rules_triggered, alerts

        if not calibration_valid:
            rules_triggered.append("RULE_CALIB_INVALID: Camera calibration status unverified")
            alerts.append({
                "type": "CALIBRATION_ERROR",
                "severity": "CRITICAL",
                "title": "Invalid Camera Calibration",
                "message": "Metrology calibration expired or matrix out of bounds.",
            })
            return "NEEDS_REVIEW", "System Warning: Metrology calibration expired.", rules_triggered, alerts

        # 2. Dimensional Tolerance Checks
        if dimensions.get("status") == "FAIL":
            dim_violations = [d for d in dimensions.get("dimension_items", []) if d.get("status") == "FAIL"]
            reasons = []
            for d in dim_violations:
                reasons.append(
                    f"{d['dimension_name']} ({d['measured_value_mm']} mm) outside tolerance [{d['expected_min_mm']} - {d['expected_max_mm']} mm]"
                )
            reason_str = f"Dimensional out of tolerance: {', '.join(reasons)}"
            rules_triggered.append(f"RULE_DIMENSION_VIOLATION: {reason_str}")
            alerts.append({
                "type": "DIMENSION_OUT_OF_TOLERANCE",
                "severity": "MAJOR",
                "title": "Dimensional Out of Tolerance",
                "message": reason_str,
            })
            return "FAIL", reason_str, rules_triggered, alerts

        # 3. Critical Surface Defect Checks
        critical_defects = [d for d in defects if d.get("severity") == "CRITICAL"]
        if critical_defects:
            top_crit = critical_defects[0]
            reason_str = (
                f"Critical Defect: {top_crit['defect_type'].replace('_', ' ').title()} "
                f"(Length: {top_crit.get('length_mm')} mm, Conf: {int(top_crit.get('confidence', 0)*100)}%)"
            )
            rules_triggered.append("RULE_CRITICAL_DEFECT_REJECT")
            alerts.append({
                "type": "CRITICAL_DEFECT",
                "severity": "CRITICAL",
                "title": "Critical Defect Detected",
                "message": reason_str,
            })
            return "FAIL", reason_str, rules_triggered, alerts

        # 4. Major Defect & Rework Checks
        major_defects = [d for d in defects if d.get("severity") in ["MAJOR", "MODERATE"]]
        if major_defects:
            top_maj = major_defects[0]
            reason_str = (
                f"Surface Defect for Grinding/Rework: {top_maj['defect_type'].replace('_', ' ').title()} "
                f"(Length: {top_maj.get('length_mm')} mm, Area: {top_maj.get('area_mm2')} mm²)"
            )
            rules_triggered.append("RULE_MAJOR_DEFECT_REWORK")
            alerts.append({
                "type": "CRITICAL_DEFECT",
                "severity": "MAJOR",
                "title": "Defect Requires Rework",
                "message": reason_str,
            })
            return "REWORK", reason_str, rules_triggered, alerts

        # 5. NDT Subsurface Defect Checks
        subsurface = ndt_result.get("subsurface_defects", [])
        if subsurface:
            reason_str = f"Subsurface/Internal defect detected by NDT: {subsurface[0]['type']}"
            rules_triggered.append("RULE_NDT_INTERNAL_FLAW")
            alerts.append({
                "type": "NDT_POSITIVE",
                "severity": "MAJOR",
                "title": "NDT Subsurface Defect Detected",
                "message": reason_str,
            })
            return "FAIL", reason_str, rules_triggered, alerts

        if ndt_result.get("fusion_status") == "SUBSURFACE_NEAR_SURFACE_FLAW":
            rules_triggered.append("RULE_NDT_VISION_CONFLICT")
            return "NEEDS_REVIEW", "Sensor conflict: Eddy Current flagged near-surface anomaly; vision unconfirmed.", rules_triggered, alerts

        # 6. OCR Confidence Gate Check
        ocr_conf = ocr_result.get("confidence", 1.0)
        if ocr_conf < 0.65 or "UNKNOWN" in ocr_result.get("heat_number", ""):
            reason_str = f"OCR marking confidence low ({int(ocr_conf*100)}%). Manual verification required."
            rules_triggered.append("RULE_OCR_LOW_CONFIDENCE")
            alerts.append({
                "type": "OCR_FAILURE",
                "severity": "MODERATE",
                "title": "OCR Low Confidence",
                "message": reason_str,
            })
            return "NEEDS_REVIEW", reason_str, rules_triggered, alerts

        # 7. All Validated: Clean PASS
        rules_triggered.append("RULE_ALL_METALLURGICAL_SPECS_PASSED")
        return "PASS", "All dimensional, surface, and traceability criteria met.", rules_triggered, alerts

decision_engine = QualityDecisionEngine()
