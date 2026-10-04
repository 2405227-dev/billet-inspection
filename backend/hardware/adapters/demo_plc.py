import time
from typing import Dict, Any, List
from backend.hardware.interfaces import PLCInterface, HardwareStatus

class DemoPLC(PLCInterface):
    """
    PLC / Line Automation Simulator.
    Simulates industrial digital I/O and fieldbus registers (OPC-UA / Modbus TCP).
    """
    def __init__(self):
        self.mode = HardwareStatus.DEMO_SIMULATION
        self.conveyor_running = True
        self.billet_present = True
        self.emergency_stop = False
        self.reject_diverter_extended = False
        self.last_disposition_sent: Dict[str, Any] = {}

    def read_signals(self) -> Dict[str, Any]:
        return {
            "device": "DemoPLCController_S7_1500",
            "protocol": "OPC-UA (Simulated)",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "signals": {
                "CONVEYOR_RUNNING": self.conveyor_running,
                "PHOTO_EYE_INSPECTION_ENTRY": self.billet_present,
                "INSPECTION_SYSTEM_READY": True,
                "SAFETY_INTERLOCK_OK": True,
                "EMERGENCY_STOP": self.emergency_stop,
                "DIVERTER_CYLINDER_RETRACTED": not self.reject_diverter_extended,
            },
            "timestamp": time.time(),
        }

    def write_disposition(self, billet_id: str, disposition: str, actuator_id: str = "DIVERT_01") -> bool:
        """
        Actuates pneumatic / robotic diverter gate based on final inspection decision:
        - PASS: Keep in-line to rolling mill / finished cooling bed
        - REWORK: Actuate diverter to conditioning grinding bay
        - FAIL: Actuate diverter to scrap reject bin
        """
        self.reject_diverter_extended = (disposition in ["FAIL", "REWORK"])
        self.last_disposition_sent = {
            "billet_id": billet_id,
            "disposition": disposition,
            "actuator_id": actuator_id,
            "diverter_extended": self.reject_diverter_extended,
            "timestamp": time.time(),
        }
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": "DemoPLCController",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "hardware_note": "Physical PLC fieldbus not connected. Running internal software register simulator.",
            "last_action": self.last_disposition_sent,
        }

plc_service = DemoPLC()
