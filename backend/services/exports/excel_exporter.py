import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from typing import List, Dict, Any
from pathlib import Path
from backend.core.config import settings

def export_audit_excel(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """
    Generates high-grade 3-sheet Excel Workbook:
    1. 'Inspection Audit' (One row per physical billet)
    2. 'Defect Details' (Granular micro-defect entries)
    3. 'Audit Summary' (Aggregated KPIs, defect distributions, OCR stats)
    """
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark slate
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Segoe UI", size=14, bold=True, color="1E293B")
    data_font = Font(name="Segoe UI", size=10)
    bold_data_font = Font(name="Segoe UI", size=10, bold=True)
    
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    pass_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid") # Light Green
    fail_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Light Red
    rework_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Light Amber
    review_fill = PatternFill(start_color="FEF9C3", end_color="FEF9C3", fill_type="solid") # Light Yellow

    # ==========================================
    # SHEET 1: Inspection Audit
    # ==========================================
    ws_audit = wb.create_sheet(title="Inspection Audit")
    
    headers_audit = [
        "Inspection ID", "Timestamp", "Billet ID", "Heat Number", "Batch ID",
        "Length (mm)", "Width (mm)", "Height (mm)", "Dimension Result",
        "OCR Text", "OCR Conf (%)", "Defect Count", "Final Status",
        "Decision Reason", "Latency (ms)", "Camera", "Model Version",
        "Calibration Version", "SHA-256 Audit Hash"
    ]
    
    ws_audit.append(headers_audit)
    for col_num in range(1, len(headers_audit) + 1):
        cell = ws_audit.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    ws_audit.row_dimensions[1].height = 28

    for row_idx, rec in enumerate(inspections, start=2):
        status_val = rec.get("status", "PASS")
        ocr_conf_pct = round(rec.get("ocr_confidence", 0.0) * 100, 1)
        
        row_data = [
            rec.get("id"),
            str(rec.get("timestamp"))[:19],
            rec.get("billet_id"),
            rec.get("heat_number"),
            rec.get("batch_id"),
            rec.get("length_mm"),
            rec.get("width_mm"),
            rec.get("height_mm"),
            rec.get("dimension_status", "PASS"),
            rec.get("ocr_text", "N/A"),
            ocr_conf_pct,
            rec.get("defect_count", 0),
            status_val,
            rec.get("decision_reason"),
            rec.get("processing_latency_ms"),
            ", ".join(rec.get("camera_ids", ["CAM-01"])),
            rec.get("model_version"),
            rec.get("calibration_version"),
            rec.get("audit_hash"),
        ]
        ws_audit.append(row_data)
        
        for col_idx in range(1, len(row_data) + 1):
            cell = ws_audit.cell(row=row_idx, column=col_idx)
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center")
            if col_idx in [6, 7, 8, 11, 12, 15]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
            
            # Status highlight
            if col_idx == 13: # Final Status
                cell.font = bold_data_font
                if status_val == "PASS":
                    cell.fill = pass_fill
                elif status_val == "FAIL":
                    cell.fill = fail_fill
                elif status_val == "REWORK":
                    cell.fill = rework_fill
                else:
                    cell.fill = review_fill

    # Auto-adjust column widths
    for col in ws_audit.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws_audit.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # ==========================================
    # SHEET 2: Defect Details
    # ==========================================
    ws_defects = wb.create_sheet(title="Defect Details")
    headers_defects = [
        "Inspection ID", "Billet ID", "Defect ID", "Defect Type",
        "Severity", "Confidence (%)", "Location Face", "Length (mm)",
        "Width (mm)", "Area (mm²)", "Orientation (°)", "Evidence Path"
    ]
    ws_defects.append(headers_defects)
    for col_num in range(1, len(headers_defects) + 1):
        cell = ws_defects.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    ws_defects.row_dimensions[1].height = 28

    defect_row_idx = 2
    for rec in inspections:
        defects = rec.get("defects", [])
        for d in defects:
            conf_pct = round(d.get("confidence", 0.0) * 100, 1)
            row_data = [
                rec.get("id"),
                rec.get("billet_id"),
                d.get("id"),
                d.get("defect_type"),
                d.get("severity"),
                conf_pct,
                d.get("surface_face", "TOP"),
                d.get("length_mm"),
                d.get("width_mm"),
                d.get("area_mm2"),
                d.get("orientation_deg"),
                d.get("crop_path", "N/A"),
            ]
            ws_defects.append(row_data)
            for c_idx in range(1, len(row_data) + 1):
                c_cell = ws_defects.cell(row=defect_row_idx, column=c_idx)
                c_cell.font = data_font
                c_cell.border = thin_border
                c_cell.alignment = Alignment(vertical="center")
            defect_row_idx += 1

    for col in ws_defects.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws_defects.column_dimensions[col_letter].width = max(max_len + 3, 14)

    # ==========================================
    # SHEET 3: Audit Summary
    # ==========================================
    ws_summary = wb.create_sheet(title="Audit Summary")
    
    # Calculate stats
    total_billets = len(inspections)
    pass_count = sum(1 for i in inspections if i.get("status") == "PASS")
    fail_count = sum(1 for i in inspections if i.get("status") == "FAIL")
    rework_count = sum(1 for i in inspections if i.get("status") == "REWORK")
    review_count = sum(1 for i in inspections if i.get("status") == "NEEDS_REVIEW")
    
    avg_latency = round(sum(i.get("processing_latency_ms", 0) for i in inspections) / max(total_billets, 1), 1)
    ocr_success = sum(1 for i in inspections if i.get("ocr_confidence", 0) >= 0.80)
    ocr_pct = round((ocr_success / max(total_billets, 1)) * 100, 1)
    
    ws_summary["A1"] = "INDUSTRIAL BILLET INSPECTION PLATFORM - BATCH AUDIT SUMMARY"
    ws_summary["A1"].font = title_font
    
    summary_rows = [
        ("", ""),
        ("Audit Generation Timestamp:", str(Path(output_path).stat().st_mtime if output_path.exists() else "Active Shift")),
        ("Total Inspected Billets:", total_billets),
        ("Passed (First-Time Yield):", pass_count),
        ("Rejected (FAIL):", fail_count),
        ("Sent for Grinding/Rework:", rework_count),
        ("Pending Human Review:", review_count),
        ("Pass Rate (%):", f"{round((pass_count / max(total_billets, 1)) * 100, 2)}%"),
        ("OCR Recognition Rate (>=80% Conf):", f"{ocr_pct}%"),
        ("Average Cycle Latency:", f"{avg_latency} ms"),
    ]
    
    for r_idx, (label, val) in enumerate(summary_rows, start=2):
        ws_summary.cell(row=r_idx, column=1, value=label).font = bold_data_font
        ws_summary.cell(row=r_idx, column=2, value=val).font = data_font
    
    ws_summary.column_dimensions["A"].width = 38
    ws_summary.column_dimensions["B"].width = 25

    wb.save(str(output_path))
    return output_path
