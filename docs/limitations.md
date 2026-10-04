# BilletVision: System Limitations & Engineering Constraints

## 1. Physical Hardware & Optical Limitations
1. **Bottom Surface Occlusion**: A top/side optical camera rig cannot observe the bottom surface resting on conveyor rollers. Bottom inspection requires a dedicated turnover station or subterranean optical array.
2. **Mill Scale Concealment**: Heavy oxide scale can visually mask sub-surface cracks. Optical vision is complemented by ECA electromagnetic inspection for this reason.
3. **Internal Discontinuities**: Optical cameras and laser profilers only measure exterior surfaces. Internal volumetric integrity requires Phased Array Ultrasonic Testing (PAUT).

---

## 2. Model Validation & Accuracy Notice
- No AI model achieves 100% defect detection under fluctuating steel mill lighting and variable scale conditions.
- System metrics represent validated test dataset performance on prototype hardware and require plant-specific on-site calibration before commercial deployment.
- Low OCR confidence (&lt;80%) automatically flags the billet for human inspector review rather than guessing.
