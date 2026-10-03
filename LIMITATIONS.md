# System Assumptions, Boundaries & Industrial Limitations

> **Engineering Honesty & Metallurgical Physics Boundaries**

---

## ⚠️ Fundamental Industrial Limitations

### 1. Visible Surface vs. Subsurface & Internal Flaws
- **Physical Boundary**: Optical RGB and monochrome camera systems can ONLY detect flaws that have a physical opening or manifestation on the outer boundary of the billet.
- **Subsurface Cracks & Mill Scale**: Cracks concealed entirely beneath thick, unbroken mill oxide scale cannot be resolved with optical photons alone.
- **Required Solution**: Optical vision must be paired with **Eddy Current Array (ECA)** for near-surface flaws and **Phased Array Ultrasonic Testing (PAUT)** for internal core porosity and central pipe. The platform provides this via the `NDTSensorFusionEngine`.

---

### 2. High-Temperature Billet Imaging (Red-Hot Radiation)
- **Physical Boundary**: Billets exiting continuous casters at temperatures $> 600^\circ\text{C}$ emit intense blackbody infrared radiation that blinds standard visible sensors.
- **Required Solution**: Optical setups for red-hot billets require **narrowband blue LED illumination (450 nm)** paired with **narrowband optical bandpass filters** on the lens to overpower thermal infrared glow.

---

### 3. Dimensional Accuracy vs. Calibration Stability
- **Physical Boundary**: Claiming sub-millimeter optical dimensional accuracy requires mechanical rigidity of camera mountings. High vibrations on rolling mill stands can cause camera displacement over time.
- **Required Solution**: Automated daily reference target re-calibration and continuous homography validation.

---

### 4. Machine Learning Domain Generalization
- **Physical Boundary**: AI segmentation models trained on one steel grade or mill finish may experience domain shift when processing different grades (e.g. high-manganese vs plain carbon steel) due to differing surface scale textures.
- **Required Solution**: Fine-tuning with grouped billet datasets and retraining via the `ml/train_defect_detector.py` pipeline.
