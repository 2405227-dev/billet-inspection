import hashlib
import json
from typing import Dict, Any, List, Tuple

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def extract_canonical_payload(record: Dict[str, Any]) -> Dict[str, Any]:
    """Extracts standard canonical audit payload fields."""
    return {
        "inspection_id": record.get("inspection_id") or record.get("id"),
        "billet_id": record.get("billet_id"),
        "heat_number": record.get("heat_number"),
        "batch_id": record.get("batch_id"),
        "timestamp": str(record.get("timestamp")),
        "status": record.get("status"),
        "length_mm": record.get("length_mm"),
        "width_mm": record.get("width_mm"),
        "height_mm": record.get("height_mm"),
        "defect_count": record.get("defect_count", 0),
        "ocr_text": record.get("ocr_text"),
        "decision_reason": record.get("decision_reason"),
        "model_version": record.get("model_version"),
        "calibration_version": record.get("calibration_version"),
    }

def canonical_serialize(data: Dict[str, Any]) -> str:
    """Serialize dictionary canonically for deterministic SHA-256 hashing."""
    def default_converter(o):
        if hasattr(o, "isoformat"):
            return o.isoformat()
        return str(o)
    
    return json.dumps(data, sort_keys=True, default=default_converter, separators=(',', ':'))

def calculate_audit_hash(previous_hash: str, record_payload: Dict[str, Any]) -> str:
    """
    Computes SHA-256 hash chaining:
    H_n = SHA-256(H_(n-1) + canonical_json(canonical_payload))
    """
    prev = previous_hash or GENESIS_HASH
    payload = extract_canonical_payload(record_payload)
    payload_str = canonical_serialize(payload)
    chain_input = f"{prev}:{payload_str}".encode('utf-8')
    return hashlib.sha256(chain_input).hexdigest()

def verify_audit_chain(records: List[Dict[str, Any]]) -> Tuple[bool, int, str]:
    """
    Validates complete cryptographic integrity of the historical inspection chain.
    Returns (is_valid, failing_index, message)
    """
    if not records:
        return True, 0, "No records in audit chain."
    
    expected_prev_hash = GENESIS_HASH
    
    for idx, rec in enumerate(records):
        actual_prev_hash = rec.get("previous_audit_hash") or GENESIS_HASH
        stored_hash = rec.get("audit_hash")
        
        # 1. Verify previous hash link
        if idx > 0 and actual_prev_hash != expected_prev_hash:
            return (
                False,
                idx,
                f"Hash link broken at record {idx} (Inspection: {rec.get('inspection_id') or rec.get('id')}). "
                f"Expected prev_hash: {expected_prev_hash[:12]}..., got: {actual_prev_hash[:12]}..."
            )
        
        # 2. Extract payload and verify hash match
        recalculated_hash = calculate_audit_hash(actual_prev_hash, rec)
        if recalculated_hash != stored_hash:
            return (
                False,
                idx,
                f"Cryptographic tampering detected at record {idx} (Inspection: {rec.get('inspection_id') or rec.get('id')}). "
                f"Stored hash {stored_hash[:12]}... does not match recalculated hash {recalculated_hash[:12]}..."
            )
        
        expected_prev_hash = stored_hash
        
    return True, len(records), f"Audit chain verified successfully across {len(records)} permanent records."
