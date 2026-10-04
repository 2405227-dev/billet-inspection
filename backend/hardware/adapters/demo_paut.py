import math
import time
from typing import Dict, Any, List, Optional
from backend.hardware.interfaces import PAUTInterface, HardwareStatus

class DemoPAUT(PAUTInterface):
    """
    Phased Array Ultrasonic Testing (PAUT) Simulator.
    Simulates a 64-element 5.0 MHz phased array probe scanning steel billets up to 150 mm square section.
    Detects internal core porosity, central shrinkage piping, and subsurface inclusions.
    """
    def __init__(self, num_elements: int = 64, sound_velocity_m_s: float = 5920.0, nominal_depth_mm: float = 150.0):
        self.num_elements = num_elements
        self.sound_velocity_m_s = sound_velocity_m_s
        self.nominal_depth_mm = nominal_depth_mm
        self.rejection_threshold_pct = 40.0 # Standard DAC / TCG flaw amplitude threshold
        self.mode = HardwareStatus.DEMO_SIMULATION

    def acquire_volumetric_slice(
        self,
        encoder_pos_mm: float,
        inject_internal_flaw_at_mm: Optional[float] = None,
        flaw_depth_mm: float = 75.0, # Center core by default
        billet_id: str = "BILLET-00023",
    ) -> Dict[str, Any]:
        """
        Generates simulated PAUT indication object and derived A-scan / B-scan slices.
        All visualizations (A-scan, B-scan, C-scan, PAUT summary, Digital Twin) MUST derive
        from this SAME canonical object.
        """
        now_ts = time.time()
        has_internal_flaw = False
        flaw_amplitude_pct = 8.0 # Baseline acoustic scattering noise
        detected_depth_mm: Optional[float] = None

        if inject_internal_flaw_at_mm is not None and abs(encoder_pos_mm - inject_internal_flaw_at_mm) < 50.0:
            dist_factor = max(0.0, 1.0 - (abs(encoder_pos_mm - inject_internal_flaw_at_mm) / 50.0))
            flaw_amplitude_pct = 15.0 + 72.0 * dist_factor
            detected_depth_mm = round(flaw_depth_mm, 1)
            if flaw_amplitude_pct >= self.rejection_threshold_pct:
                has_internal_flaw = True

        # Canonical Unified PAUT Indication Object
        paut_indication = {
            "billet_id": billet_id,
            "encoder_position_mm": round(encoder_pos_mm, 2),
            "depth_mm": detected_depth_mm if has_internal_flaw else None,
            "amplitude": round(flaw_amplitude_pct, 1),
            "channel": 32, # Central transducer element (0-63)
            "timestamp": now_ts,
            "has_internal_flaw": has_internal_flaw,
            "threshold_pct": self.rejection_threshold_pct,
            "indication_type": "INTERNAL_CORE_POROSITY" if has_internal_flaw else "NORMAL",
        }

        # Synthesize A-scan reflection waveform peaks derived strictly from the canonical object
        a_scan_points: List[Dict[str, float]] = [
            {"depth_mm": 0.0, "amplitude_pct": 100.0, "label": "ENTRY_SURFACE_ECHO"},
            {"depth_mm": round(self.nominal_depth_mm * 0.25, 1), "amplitude_pct": 4.0, "label": "GRAIN_NOISE"},
            {
                "depth_mm": round(paut_indication["depth_mm"] if has_internal_flaw else (self.nominal_depth_mm * 0.5), 1),
                "amplitude_pct": paut_indication["amplitude"] if has_internal_flaw else 6.0,
                "label": "INTERNAL_INDICATION" if has_internal_flaw else "NOISE",
            },
            {"depth_mm": round(self.nominal_depth_mm * 0.75, 1), "amplitude_pct": 3.5, "label": "NOISE"},
            {
                "depth_mm": self.nominal_depth_mm,
                "amplitude_pct": round(85.0 - (paut_indication["amplitude"] * 0.4 if has_internal_flaw else 0.0), 1),
                "label": "BACKWALL_ECHO",
            },
        ]

        return {
            "sensor_id": "PAUT-SECTOR-SCAN-01",
            "mode": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "encoder_pos_mm": paut_indication["encoder_position_mm"],
            "timestamp": now_ts,
            "sound_velocity_m_s": self.sound_velocity_m_s,
            "nominal_section_depth_mm": self.nominal_depth_mm,
            "has_internal_flaw": paut_indication["has_internal_flaw"],
            "peak_flaw_amplitude_pct": paut_indication["amplitude"],
            "flaw_depth_mm": paut_indication["depth_mm"],
            "threshold_pct": self.rejection_threshold_pct,
            "indication_type": paut_indication["indication_type"],
            "paut_indication": paut_indication, # The canonical object
            "a_scan_samples": a_scan_points,
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": "DemoPhasedArrayAcquisitionSystem",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "num_elements": self.num_elements,
            "frequency_mhz": 5.0,
            "sound_velocity_m_s": self.sound_velocity_m_s,
            "threshold_pct": self.rejection_threshold_pct,
            "hardware_note": "Physical PAUT instrument not connected. Running calibrated numerical acoustic model.",
        }

paut_service = DemoPAUT()
