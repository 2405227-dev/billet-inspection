# QA & Automated Verification Test Suite

---

## 🧪 Test Coverage Matrix

The test suite in [`tests/test_inspection_pipeline.py`](file:///c:/Users/acer/Desktop/nit%20raipur/tests/test_inspection_pipeline.py) verifies all core modules end-to-end:

| Test Case | Scope | Outcome |
|---|---|---|
| `test_camera_generation` | Frame generation, resolution, metadata | **PASSED** |
| `test_metrology_measurement` | Sub-pixel edge detection, calibration, tolerance gates | **PASSED** |
| `test_defect_segmentation` | Multi-scale CLAHE, tile masks, morphology | **PASSED** |
| `test_ocr_extraction` | Stencil ROI cropping, regex matching, confidence | **PASSED** |
| `test_decision_engine` | Deterministic PASS / FAIL / REWORK gating | **PASSED** |
| `test_duplicate_billet_prevention`| Conveyor tracker session lifecycle & duplicate guard | **PASSED** |
| `test_audit_hash_chaining` | SHA-256 block linking and tamper detection | **PASSED** |
| `test_exports_and_reports` | OpenPyXL Excel (3 sheets), CSV & ReportLab PDFs | **PASSED** |

---

## 🏃 Running the Tests

```bash
.venv\Scripts\python.exe -m pytest tests/test_inspection_pipeline.py -v
```
All 8 test suites execute synchronously and validate the entire software stack.
