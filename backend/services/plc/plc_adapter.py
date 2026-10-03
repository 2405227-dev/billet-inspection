from abc import ABC, abstractmethod
import logging
import time
from typing import Dict, Any

logger = logging.getLogger("billet.plc")

class PLCAdapter(ABC):
    """Abstract Base Class for Industrial Programmable Logic Controller (PLC) integration."""
    @abstractmethod
    def connect(self) -> bool:
        pass

    @abstractmethod
    def send_decision(self, inspection_id: str, billet_id: str, decision: str, reason: str) -> bool:
        pass

    @abstractmethod
    def trigger_reject_diverter(self, lane: int = 1) -> bool:
        pass

    @abstractmethod
    def trigger_rework_kicker(self) -> bool:
        pass

    @abstractmethod
    def set_stack_light(self, red: bool, yellow: bool, green: bool, sounder: bool) -> bool:
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        pass

class PLCSimulator(PLCAdapter):
    """
    High-fidelity PLC Simulator with support for OPC-UA / Modbus TCP tag mapping.
    Outputs: PASS, REJECT, HOLD, ALARM.
    """
    def __init__(self):
        self.is_connected = True
        self.last_decision = "NONE"
        self.last_inspection_id = None
        self.diverter_active = False
        self.rework_kicker_active = False
        self.stack_light_state = {"RED": False, "YELLOW": False, "GREEN": True, "SOUNDER": False}
        self.total_signals_sent = 0

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def send_decision(self, inspection_id: str, billet_id: str, decision: str, reason: str) -> bool:
        self.last_decision = decision
        self.last_inspection_id = inspection_id
        self.total_signals_sent += 1
        
        if decision == "PASS":
            self.set_stack_light(red=False, yellow=False, green=True, sounder=False)
            self.diverter_active = False
            self.rework_kicker_active = False
            logger.info(f"[PLC-OUT] Billet {billet_id} -> ROUTE_CONTINUOUS_CONVEYOR (PASS)")
        elif decision == "FAIL":
            self.set_stack_light(red=True, yellow=False, green=False, sounder=True)
            self.trigger_reject_diverter(lane=1)
            logger.warning(f"[PLC-OUT] Billet {billet_id} -> REJECT_DIVERTER_ACTIVATED: {reason}")
        elif decision == "REWORK":
            self.set_stack_light(red=False, yellow=True, green=False, sounder=False)
            self.trigger_rework_kicker()
            logger.info(f"[PLC-OUT] Billet {billet_id} -> REWORK_GRINDING_BUFFER: {reason}")
        else: # NEEDS_REVIEW / HOLD
            self.set_stack_light(red=False, yellow=True, green=False, sounder=True)
            logger.warning(f"[PLC-OUT] Billet {billet_id} -> HOLD_AT_REVIEW_STATION: {reason}")
        return True

    def trigger_reject_diverter(self, lane: int = 1) -> bool:
        self.diverter_active = True
        return True

    def trigger_rework_kicker(self) -> bool:
        self.rework_kicker_active = True
        return True

    def set_stack_light(self, red: bool, yellow: bool, green: bool, sounder: bool) -> bool:
        self.stack_light_state = {"RED": red, "YELLOW": yellow, "GREEN": green, "SOUNDER": sounder}
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "protocol": "OPC-UA / Modbus-TCP Simulator",
            "is_connected": self.is_connected,
            "last_decision": self.last_decision,
            "last_inspection_id": self.last_inspection_id,
            "stack_light": self.stack_light_state,
            "diverter_active": self.diverter_active,
            "rework_kicker_active": self.rework_kicker_active,
            "total_signals": self.total_signals_sent,
        }

plc_service = PLCSimulator()
