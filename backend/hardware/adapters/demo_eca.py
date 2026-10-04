import math
import time
from typing import Dict, Any, List, Optional
from backend.hardware.interfaces import ECAInterface, HardwareStatus

class DemoECA(ECAInterface):
    """
    Eddy Current Array (ECA) Instrument Simulator.
    Simulates a 16-channel array probe traversing the billet surface.
    Detects surface-breaking and near-surface cracks beneath mill scale.
    """
    def __init__(self, num_channels: int = 16, probe_frequency_khz: float = 250.0):
        self.num_channels = num_channels
        self.probe_frequency_khz = probe_frequency_khz
        self.threshold_mv = 120.0
        self.mode = HardwareStatus.DEMO_SIMULATION

    def acquire_scan_slice(
        self,
        encoder_pos_mm: float,
        inject_defect_at_mm: Optional[float] = None,
        defect_channel: int = 7,
    ) -> Dict[str, Any]:
        """
        Generates multi-channel ECA impedance readings at a specific conveyor position.
        """
        channels_data: List[Dict[str, Any]] = []
        has_indication = False
        max_amplitude = 0.0

        # Baseline noise floor across array elements
        for ch in range(self.num_channels):
            # Baseline baseline impedance
            noise = 25.0 + math.sin(encoder_pos_mm * 0.02 + ch) * 12.0
            phase = 45.0 + (ch * 2.5) % 15.0

            # If simulated defect is near this encoder position and channel
            if inject_defect_at_mm is not None and abs(encoder_pos_mm - inject_defect_at_mm) < 35.0:
                dist_factor = max(0.0, 1.0 - (abs(encoder_pos_mm - inject_defect_at_mm) / 35.0))
                if abs(ch - defect_channel) <= 2:
                    channel_factor = max(0.0, 1.0 - (abs(ch - defect_channel) / 3.0))
                    noise += 260.0 * dist_factor * channel_factor
                    phase = 88.5 # Phase signature indicative of open tight crack

            amplitude_mv = round(noise, 1)
            max_amplitude = max(max_amplitude, amplitude_mv)
            is_ch_defect = amplitude_mv >= self.threshold_mv

            if is_ch_defect:
                has_indication = True

            channels_data.append({
                "channel_idx": ch,
                "amplitude_mv": amplitude_mv,
                "phase_deg": round(phase, 1),
                "is_indication": is_ch_defect,
            })

        return {
            "sensor_id": "ECA-ARRAY-PROBE-01",
            "mode": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "encoder_pos_mm": round(encoder_pos_mm, 2),
            "timestamp": time.time(),
            "probe_frequency_khz": self.probe_frequency_khz,
            "num_channels": self.num_channels,
            "threshold_mv": self.threshold_mv,
            "max_amplitude_mv": max_amplitude,
            "has_indication": has_indication,
            "indication_type": "SURFACE_CRACK_IMPEDANCE_ANOMALY" if has_indication else "NORMAL",
            "channels": channels_data,
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": "DemoECAArrayAcquisitionSystem",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "num_channels": self.num_channels,
            "probe_frequency_khz": self.probe_frequency_khz,
            "threshold_mv": self.threshold_mv,
            "hardware_note": "Physical ECA instrumentation not connected. Running calibrated numerical simulator.",
        }

eca_service = DemoECA()
