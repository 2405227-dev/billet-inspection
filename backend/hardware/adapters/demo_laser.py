import math
import time
from typing import Dict, Any, List, Optional
from backend.hardware.interfaces import Laser3DInterface, HardwareStatus

class DemoLaser3D(Laser3DInterface):
    """
    3D Laser Profile Triangulation Simulator.
    Simulates a sheet-of-light laser line across billet width (150 mm) measuring surface topography and corner geometry.
    """
    def __init__(self, sample_points: int = 128, nominal_width_mm: float = 150.0, nominal_height_mm: float = 150.0):
        self.sample_points = sample_points
        self.nominal_width_mm = nominal_width_mm
        self.nominal_height_mm = nominal_height_mm
        self.mode = HardwareStatus.DEMO_SIMULATION

    def acquire_profile(
        self,
        encoder_pos_mm: float,
        inject_surface_depression_at_mm: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generates a 2D surface slice height profile (Z height in mm across X width 0 to 150 mm).
        """
        profile_points: List[Dict[str, float]] = []
        step_mm = self.nominal_width_mm / max(self.sample_points - 1, 1)

        has_depression = False
        if inject_surface_depression_at_mm is not None and abs(encoder_pos_mm - inject_surface_depression_at_mm) < 40.0:
            has_depression = True

        for i in range(self.sample_points):
            x_mm = i * step_mm
            # Nominal flat surface height = nominal_height_mm (150.0 mm) with natural rolling roughness (±0.08 mm)
            roughness = math.sin(x_mm * 0.4 + encoder_pos_mm * 0.05) * 0.06
            z_mm = self.nominal_height_mm + roughness

            # Corner chamfer / rounding roll radius (~4 mm radius at edges)
            if x_mm < 4.0:
                z_mm -= (4.0 - x_mm) * 0.6
            elif x_mm > (self.nominal_width_mm - 4.0):
                z_mm -= (x_mm - (self.nominal_width_mm - 4.0)) * 0.6

            # Surface depression (scab or gouge)
            if has_depression and 50.0 < x_mm < 90.0:
                dist_center = abs(x_mm - 70.0) / 20.0
                z_mm -= max(0.0, 1.8 * (1.0 - dist_center))

            profile_points.append({
                "x_width_mm": round(x_mm, 2),
                "z_height_mm": round(z_mm, 2),
            })

        return {
            "sensor_id": "LASER-3D-TRIANG-01",
            "mode": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "encoder_pos_mm": round(encoder_pos_mm, 2),
            "timestamp": time.time(),
            "profile_points": profile_points,
            "measured_mean_height_mm": round(sum(p["z_height_mm"] for p in profile_points) / len(profile_points), 2),
            "surface_roughness_ra_um": 12.4,
            "has_topography_anomaly": has_depression,
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "device": "DemoLaserTriangulationSensor",
            "status": self.mode,
            "mode_label": "SIMULATION / DEMO MODE",
            "sample_points_per_profile": self.sample_points,
            "wavelength_nm": 405, # Blue laser diode
            "calibrated_fov_width_mm": 220.0,
            "hardware_note": "Physical laser triangulation sensor not connected. Running calibrated numerical surface profiler.",
        }

laser_service = DemoLaser3D()
