# Permanent Cryptographic Audit Trail & Hash Chaining Specification

> **Standard**: Append-Only Immutable Inspection Log with SHA-256 Block Chaining

---

## 🔒 Cryptographic Architecture

To satisfy strict ISO 9001 and IATF 16949 automotive and aerospace quality traceability standards, every inspected billet is permanently recorded using an **append-only cryptographic hash chain**.

### Hash Chaining Formula

For the genesis record ($n=0$):
$$H_0 = \text{SHA256}(\text{"0000000000000000000000000000000000000000000000000000000000000000"} : \text{CanonicalJSON}(\text{Record}_0))$$

For any subsequent completed inspection record ($n \ge 1$):
$$H_n = \text{SHA256}(H_{n-1} : \text{CanonicalJSON}(\text{Record}_n))$$

Where `CanonicalJSON` is a deterministic, sorted-key serialization of the immutable inspection payload:
```json
{
  "calibration_version": "CALIB-CAM01-2026-v4",
  "decision_reason": "Clean inspection",
  "defect_count": 0,
  "heat_number": "26A-1042",
  "height_mm": 150.0,
  "inspection_id": "INS-2026-000001",
  "length_mm": 6002.0,
  "model_version": "surface-defect-ensemble-seg:v3.2.0",
  "ocr_text": "HEAT-26A-1042",
  "status": "PASS",
  "timestamp": "2026-10-03T12:00:00",
  "width_mm": 150.2
}
```

---

## 🛡️ Anti-Tamper Verification Mechanism

1. The `verify_audit_chain()` service reads all sequential records ordered by creation timestamp.
2. For every record $i$, it validates that `previous_audit_hash` matches $H_{i-1}$.
3. It recomputes the SHA-256 hash using the stored payload fields.
4. If an attacker modifies even 1 millimeter of length, alters a defect count, or flips a `FAIL` verdict to `PASS` directly in the database:
   - The recomputed hash $H'_i \neq H_i$.
   - The chain breaks immediately.
   - The platform flags `⚠ AUDIT INTEGRITY FAILURE` and pinpoints the exact tampered record index.
