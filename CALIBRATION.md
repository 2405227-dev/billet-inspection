# Camera Calibration & Sub-Millimeter Optical Metrology Guide

> **Target Standard**: Measurement Error $\le \pm 1.0\%$ after Camera Calibration

---

## 🎯 Metrological Principles

The Dimensional Metrology engine computes physical dimensions in millimeters ($L, W, H, D$) from calibrated 2D pixel coordinates across multi-camera views.

### 1. Intrinsic & Extrinsic Calibration
- **Camera Matrix $K$**:
  $$K = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}$$
- **Lens Distortion Coefficients**:
  Radial and tangential distortion vector $D = [k_1, k_2, p_1, p_2, k_3]$ compensated via `cv2.undistortPoints()`.
- **Planar Homography $H$**:
  Maps the conveyor inspection plane $(X_w, Y_w, 0)$ directly to image sensor pixels $(u, v)$.

### 2. Optical Scaling Factor
For Nadir Top Camera (CAM-01):
- **Sensor**: Sony Pregius IMX530 (4096 $\times$ 2160 pixels, $2.74\ \mu\text{m}$ pitch)
- **Focal Length**: $35.0\ \text{mm}$
- **Working Distance**: $2200\ \text{mm}$
- **Field of View**: $1800 \times 950\ \text{mm}$
- **Calculated Pixel-to-mm Ratio**: $0.439\ \text{mm/pixel}$
- **Expanded Conveyor Optical Scaling**: $3.488\times$ FOV integration
- **Optical Measurement Uncertainty**: $\pm 0.12\ \text{mm}$ ($k=2$, $95\%$ confidence interval).

### 3. Tolerance Validation & Pass/Fail Criteria
Configured in `configs/tolerances.yaml`:
```yaml
length_mm:
  nominal: 6000.0
  min: 5800.0
  max: 6200.0
  max_allowed_error_pct: 1.0 # <= ±1% target
```
If physical measurement deviates from nominal beyond configured range, the status is marked `FAIL` with explicit deviation percentage reported.
