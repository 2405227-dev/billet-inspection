import abc
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

# ==============================================================================
# HARDWARE ABSTRACTION LAYER (HAL) - INTERFACES
#
# These interfaces establish the contract for physical industrial equipment
# integration. In this demonstration environment, concrete Demo* adapters
# provide realistic telemetry. When physical hardware is installed in a plant,
# corresponding Industrial* adapters will be connected without changing application logic.
# ==============================================================================

class HardwareStatus:
    DISCONNECTED = "DISCONNECTED"
    CONNECTING = "CONNECTING"
    ONLINE = "ONLINE"
    DEMO_SIMULATION = "DEMO_SIMULATION"
    ERROR = "ERROR"
    CALIBRATING = "CALIBRATING"

class CameraInterface(abc.ABC):
    """Abstract interface for 2D optical area-scan and line-scan cameras (GigE Vision / GenICam / USB3)."""
    @abc.abstractmethod
    def connect(self) -> bool:
        """Establish connection with camera device/stream."""
        pass

    @abc.abstractmethod
    def disconnect(self) -> None:
        """Safely release camera resources."""
        pass

    @abc.abstractmethod
    def acquire_frame(self) -> Tuple[bool, Optional[Any], Dict[str, Any]]:
        """
        Acquires latest frame.
        Returns: (success: bool, frame_data: np.ndarray | None, metadata: dict)
        """
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns camera connection state, frame rate, temperature, and exposure settings."""
        pass

class EncoderInterface(abc.ABC):
    """Abstract interface for conveyor rotary/linear optical incremental pulse encoders."""
    @abc.abstractmethod
    def get_position_mm(self) -> float:
        """Returns instantaneous physical conveyor position in millimeters."""
        pass

    @abc.abstractmethod
    def get_velocity_mm_s(self) -> float:
        """Returns instantaneous conveyor line speed in millimeters per second."""
        pass

    @abc.abstractmethod
    def get_pulse_count(self) -> int:
        """Returns raw encoder pulse count."""
        pass

    @abc.abstractmethod
    def get_timestamp(self) -> float:
        """Returns hardware or synchronized system timestamp."""
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns encoder communication and synchronization health."""
        pass

class Laser3DInterface(abc.ABC):
    """Abstract interface for 3D laser sheet-of-light profile triangulation sensors."""
    @abc.abstractmethod
    def acquire_profile(self, encoder_pos_mm: float) -> Dict[str, Any]:
        """Acquires calibrated 2D surface slice height profile (Z vs. X across width)."""
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns laser diode health, exposure, and temperature."""
        pass

class ECAInterface(abc.ABC):
    """
    Abstract interface for Eddy Current Array (ECA) multi-element surface crack inspection instruments.
    Detects surface-breaking and near-surface flaws beneath non-conductive scale.
    """
    @abc.abstractmethod
    def acquire_scan_slice(self, encoder_pos_mm: float) -> Dict[str, Any]:
        """
        Acquires multi-channel impedance readings across sensor elements.
        Returns channel amplitudes (mV), phase angles (deg), and defect indications.
        """
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns instrument connection state, probe frequency, and excitation voltage."""
        pass

class PAUTInterface(abc.ABC):
    """
    Abstract interface for Phased Array Ultrasonic Testing (PAUT) instruments.
    Detects internal volumetric discontinuities, core piping, and central inclusions.
    """
    @abc.abstractmethod
    def acquire_volumetric_slice(self, encoder_pos_mm: float) -> Dict[str, Any]:
        """
        Acquires phased array acoustic reflections.
        Returns depth profile (mm), A-scan waveform, and B-scan / C-scan amplitude matrix.
        """
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns pulser-receiver health, wedge acoustic coupling, and sound velocity calibration."""
        pass

class PLCInterface(abc.ABC):
    """
    Abstract interface for Programmable Logic Controllers (PLCs) via OPC-UA / Modbus TCP / Profinet.
    Handles line interlocks, tracking trigger gates, and pneumatic/robotic reject diverters.
    """
    @abc.abstractmethod
    def read_signals(self) -> Dict[str, Any]:
        """Reads digital and analog input registers (conveyor running, photo-eye, emergency stop)."""
        pass

    @abc.abstractmethod
    def write_disposition(self, billet_id: str, disposition: str, actuator_id: str = "DIVERT_01") -> bool:
        """Sends diverter/reject command (PASS -> downstream roll table, REWORK -> grinding, FAIL -> scrap bin)."""
        pass

    @abc.abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Returns PLC heartbeat and bus connection state."""
        pass
