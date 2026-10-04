# BilletVision: Testing & Quality Assurance Suite

## 1. Test Architecture

The automated test suite in `tests/` validates end-to-end pipeline integrity, metrology math, NDT simulation physics, hardware abstraction contracts, failure handling, and cryptographic audit hashing.

```
tests/
├── test_inspection_pipeline.py     (Camera, Metrology, Defect Seg, OCR, Decision, Tracker, Audit, Reports)
└── test_robustness_and_failures.py (Multi-billet tracking, Encoder sync, Low OCR fallback, NDT, HAL Disclaimers)
```

---

## 2. Running Automated Tests

```bash
# Run full test suite
python -m pytest tests/ -v
```

---

## 3. Test Scenarios Covered

1. **Camera Generation**: Verifies realistic 4K/720p optical frame synthesis with texture and lighting.
2. **Sub-Pixel Metrology**: Tests length, width, height, and diagonal calculation with configured tolerance bounds.
3. **Defect Segmentation**: Validates defect bounding boxes, segmentation masks, and crop persistence.
4. **OCR & Markings**: Evaluates CLAHE contrast normalization, ROI extraction, and Heat/Batch regex parser.
5. **Multi-Billet Continuous Tracking**: Ensures sequential billets on the conveyor receive unique tracking IDs and independent inspection records.
6. **Encoder Position Synchronization**: Validates physical millimeter coordinate tracking synchronized with line speed.
7. **Low OCR Fallback**: Asserts that low confidence or unreadable text routes to `NEEDS_REVIEW`.
8. **ECA Multi-Channel Inspection**: Tests 16-channel impedance anomalies and flaw threshold triggering.
9. **PAUT Volumetric Reflection**: Tests A-scan acoustic waveform synthesis, DAC threshold line, and core porosity detection.
10. **Industrial Hardware Honesty**: Asserts that unconnected industrial adapters strictly report `DISCONNECTED`.
11. **Bottom Surface Honesty**: Ensures uninspected contact faces are strictly marked `NOT_INSPECTED`.
12. **Cryptographic SHA-256 Audit**: Verifies hash chaining and instant detection of database record tampering.
13. **Multi-Format Reporting**: Tests Excel multi-sheet (.xlsx), CSV (.csv), and ReportLab PDF (.pdf) export generation.
