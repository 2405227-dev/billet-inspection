import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("billet.ndt")

class NDTSensorFusionEngine:
    """
    Multi-Sensor Non-Destructive Testing (NDT) & Optical Fusion Adapter.
    Distinguishes VISIBLE SURFACE DEFECTS (Optical Cameras) from SUBSURFACE / INTERNAL DEFECTS (Eddy Current / Phased Array UT).
    Fuses multi-modal sensor channels with conflict detection.
    """
    def __init__(self):
        self.eddy_current_active = True
        self.ultrasonic_active = True

    def process_sensor_readings(
        self,
        vision_defects: List[Dict[str, Any]],
        simulated_ndt_trigger: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Merges Vision and NDT sensor streams.
        Returns:
            {
                "eddy_current": {...},
                "ultrasonic_testing": {...},
                "fusion_status": "CONCORDANT" | "CONFLICT_DETECTED" | "SUBSURFACE_ALERT",
                "subsurface_defects": [...]
            }
        """
        # Simulated NDT channel acquisition
        has_vision_crack = any("crack" in d.get("defect_type", "") for d in vision_defects)
        
        # Eddy Current Channel (Detects surface-breaking & near-surface flaws up to 3mm depth)
        ec_signal_mv = 45.0
        ec_status = "NORMAL"
        if has_vision_crack or simulated_ndt_trigger == "EDDY_CURRENT_POSITIVE":
            ec_signal_mv = 280.5
            ec_status = "DEFECT_DETECTED"

        # Ultrasonic Testing Channel (Detects central pipe, internal inclusions, core porosity)
        ut_attenuation_db = 1.8
        ut_status = "NORMAL"
        subsurface_defects = []

        if simulated_ndt_trigger == "INTERNAL_INCLUSION":
            ut_attenuation_db = 14.5
            ut_status = "INTERNAL_FLAW_DETECTED"
            subsurface_defects.append({
                "sensor_id": "NDT-UT-01",
                "type": "Internal Core Porosity / Inclusion",
                "depth_from_surface_mm": 35.0,
                "confidence": 0.94,
                "severity": "CRITICAL",
            })

        # Multi-modal Sensor Conflict Gate
        fusion_status = "CONCORDANT"
        conflict_note = None

        if ec_status == "DEFECT_DETECTED" and not vision_defects and simulated_ndt_trigger == "EDDY_CURRENT_POSITIVE":
            fusion_status = "SUBSURFACE_NEAR_SURFACE_FLAW"
            conflict_note = "Eddy Current detected flaw beneath mill scale; optical camera did not resolve surface opening."
        elif ut_status == "INTERNAL_FLAW_DETECTED":
            fusion_status = "SUBSURFACE_ALERT"
            conflict_note = "Ultrasonic testing detected internal volumetric defect."

        return {
            "eddy_current": {
                "sensor_id": "NDT-EC-01",
                "signal_amplitude_mv": round(ec_signal_mv, 1),
                "threshold_mv": 120.0,
                "status": ec_status,
                "confidence": 0.92,
            },
            "ultrasonic_testing": {
                "sensor_id": "NDT-UT-01",
                "attenuation_db": round(ut_attenuation_db, 1),
                "threshold_db": 8.0,
                "status": ut_status,
                "confidence": 0.94,
            },
            "fusion_status": fusion_status,
            "conflict_note": conflict_note,
            "subsurface_defects": subsurface_defects,
        }

ndt_engine = NDTSensorFusionEngine()
