# BilletVision: Simulation & Demo Mode

## 1. Purpose of Demo Mode
Demo Mode enables full end-to-end evaluation and algorithmic validation of the multimodal inspection platform without requiring live industrial cameras, laser scanners, or NDT instrumentation.

---

## 2. Simulated Modalities & Realism
1. **Conveyor Physics**: Models continuous linear movement, variable speed (500–1500 mm/s), and incremental encoder pulses.
2. **Optical Camera**: Synthesizes realistic 4K hot steel billet images with textured scale, corner chamfers, stencil heat markings, and injected defect categories.
3. **Dimensional Metrology**: Simulates sub-pixel edge detection with configurable tolerance envelopes.
4. **3D Laser Triangulation**: Computes height profiles ($Z$ vs $X$), roll marks, and surface depressions.
5. **ECA & PAUT**: Generates multi-channel electromagnetic impedance matrices and acoustic reflection waveforms.

---

## 3. Clear Visual Distinctions
In compliance with the BilletVision engineering honesty standard:
- Every simulated stream is labeled **`SIMULATION / DEMO MODE`**.
- Unconnected industrial adapters strictly report **`DISCONNECTED`**.
- Uninspected faces are marked **`NOT_INSPECTED`**.
