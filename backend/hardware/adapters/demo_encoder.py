import time
from typing import Dict, Any
from backend.hardware.interfaces import EncoderInterface, HardwareStatus

class DemoEncoder(EncoderInterface):
    """
    Simulation Encoder generating physical millimeter positions synchronized with elapsed time and conveyor line speed.
    """
    def __init__(self, conveyor_speed_mm_s: float = 1000.0, pulses_per_mm: float = 10.0):
        self.conveyor_speed_mm_s = conveyor_speed_mm_s
        self.pulses_per_mm = pulses_per_mm
        self.start_time = time.time()
        self.is_running = True
        self.mode = HardwareStatus.DEMO_SIMULATION

    def get_position_mm(self) -> float:
        elapsed = time.time() - self.start_time
        return elapsed * self.conveyor_speed_mm_s

    def get_velocity_mm_s(self) -> float:
        return self.conveyor_speed_mm_s if self.is_running else 0.0

    def get_pulse_count(self) -> int:
        return int(self.get_position_mm() * self.pulses_per_mm)

    def get_timestamp(self) -> float:
        return time.time()

    def set_speed(self, speed_mm_s: float):
        self.conveyor_speed_mm_s = max(0.0, speed_mm_s)

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": "DemoConveyorEncoder",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "speed_mm_s": self.conveyor_speed_mm_s,
            "current_position_mm": round(self.get_position_mm(), 2),
            "pulse_count": self.get_pulse_count(),
            "pulses_per_mm": self.pulses_per_mm,
        }

encoder_service = DemoEncoder(conveyor_speed_mm_s=1000.0)
