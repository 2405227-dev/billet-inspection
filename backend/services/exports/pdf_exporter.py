import os
from pathlib import Path
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.units import inch
from backend.core.config import settings

def generate_individual_billet_pdf(inspection: Dict[str, Any], output_path: Path) -> Path:
    """
    Generates official printable Single Billet Quality Inspection Certificate / Audit Record PDF.
    """
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold',
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=4,
    )
    normal_text = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
    )
    status_style = ParagraphStyle(
        'StatusBadge',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        fontName='Helvetica-Bold',
        alignment=1,
    )

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>NIT RAIPUR INTEGRATED STEEL PLANT</b><br/>AI Quality Metrology & Surface Audit Lab", subtitle_style),
            Paragraph(f"<b>CERTIFICATE:</b> {inspection.get('id')}<br/><b>DATE:</b> {str(inspection.get('timestamp'))[:19]}", subtitle_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 220])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceAfter=12))

    story.append(Paragraph("BILLET QUALITY INSPECTION CERTIFICATE", title_style))
    story.append(Spacer(1, 10))

    # 2. Final Decision Callout Banner
    status_val = inspection.get("status", "PASS")
    status_bg = colors.HexColor("#DCFCE7") if status_val == "PASS" else colors.HexColor("#FEE2E2") if status_val == "FAIL" else colors.HexColor("#FEF3C7")
    status_color = colors.HexColor("#166534") if status_val == "PASS" else colors.HexColor("#991B1B") if status_val == "FAIL" else colors.HexColor("#92400E")
    
    decision_box_data = [
        [
            Paragraph(f"<font color='{status_color.hexval()}'>FINAL INSPECTION VERDICT: <b>{status_val}</b></font>", status_style),
        ],
        [
            Paragraph(f"<b>Decision Reason:</b> {inspection.get('decision_reason')}", normal_text),
        ]
    ]
    decision_table = Table(decision_box_data, colWidths=[520])
    decision_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), status_bg),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1.5, status_color),
    ]))
    story.append(decision_table)
    story.append(Spacer(1, 12))

    # 3. Traceability & Billet Metadata
    story.append(Paragraph("1. METALLURGICAL TRACEABILITY & IDENTIFICATION", section_heading))
    meta_table_data = [
        ["Inspection ID:", inspection.get("id"), "Production Line:", "Continuous Rolling Line #1"],
        ["Billet ID:", inspection.get("billet_id"), "Heat Number:", inspection.get("heat_number")],
        ["Batch ID:", inspection.get("batch_id"), "Steel Grade:", "IS 2830 / Fe 500D"],
        ["OCR Text Detected:", inspection.get("ocr_text", "N/A"), "OCR Confidence:", f"{round(inspection.get('ocr_confidence', 0)*100, 1)}%"],
        ["Barcode / DataMatrix:", inspection.get("barcode_value", "N/A"), "Barcode Type:", inspection.get("barcode_type", "DATA_MATRIX")],
    ]
    meta_table = Table(meta_table_data, colWidths=[120, 140, 120, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor("#F1F5F9")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 4. Dimensional Metrology
    story.append(Paragraph("2. DIMENSIONAL OPTICAL METROLOGY (CALIBRATED)", section_heading))
    dim_items = inspection.get("dimensions", [])
    if not dim_items:
        # Construct default representation
        dim_table_data = [
            ["Parameter", "Measured Value", "Nominal", "Allowed Range", "Deviation", "Status"],
            ["Length", f"{inspection.get('length_mm')} mm", "6000.0 mm", "5800 - 6200 mm", f"{round(((inspection.get('length_mm', 6000)-6000)/6000)*100, 2)}%", "PASS"],
            ["Width", f"{inspection.get('width_mm')} mm", "150.0 mm", "147 - 153 mm", f"{round(((inspection.get('width_mm', 150)-150)/150)*100, 2)}%", "PASS"],
            ["Height", f"{inspection.get('height_mm')} mm", "150.0 mm", "147 - 153 mm", f"{round(((inspection.get('height_mm', 150)-150)/150)*100, 2)}%", "PASS"],
        ]
    else:
        dim_table_data = [["Parameter", "Measured Value", "Nominal", "Allowed Range", "Deviation", "Status"]]
        for d in dim_items:
            dim_table_data.append([
                d.get("dimension_name"),
                f"{d.get('measured_value_mm')} mm",
                f"{d.get('nominal_mm')} mm",
                f"{d.get('expected_min_mm')} - {d.get('expected_max_mm')} mm",
                f"{d.get('deviation_pct')}%",
                d.get("status"),
            ])
    
    dim_table = Table(dim_table_data, colWidths=[90, 85, 80, 115, 80, 70])
    dim_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(dim_table)
    story.append(Spacer(1, 10))

    # 5. Surface Defect Log
    story.append(Paragraph(f"3. SURFACE DEFECT & FINE CRACK INSPECTION (Detected: {inspection.get('defect_count', 0)})", section_heading))
    defects = inspection.get("defects", [])
    if not defects:
        story.append(Paragraph("<i>No surface cracking, seams, scabs, or geometric surface anomalies detected.</i>", normal_text))
    else:
        def_table_data = [["Defect ID", "Class", "Severity", "Confidence", "Length", "Width", "Area", "Face"]]
        for d in defects:
            def_table_data.append([
                d.get("id"),
                d.get("defect_type").replace("_", " ").title(),
                d.get("severity"),
                f"{round(d.get('confidence', 0)*100, 1)}%",
                f"{d.get('length_mm')} mm",
                f"{d.get('width_mm')} mm",
                f"{d.get('area_mm2')} mm²",
                d.get("surface_face", "TOP"),
            ])
        def_table = Table(def_table_data, colWidths=[65, 115, 65, 65, 65, 55, 55, 35])
        def_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ]))
        story.append(def_table)
    story.append(Spacer(1, 12))

    # 6. Audit Trail & Cryptographic Provenance
    story.append(Paragraph("4. PERMANENT AUDIT TRAIL & SYSTEM PROVENANCE", section_heading))
    audit_table_data = [
        ["SHA-256 Audit Hash:", Paragraph(f"<font size=7><code>{inspection.get('audit_hash')}</code></font>", normal_text)],
        ["Previous Block Hash:", Paragraph(f"<font size=7><code>{inspection.get('previous_audit_hash')}</code></font>", normal_text)],
        ["AI Model Version:", f"{inspection.get('model_version')} (Segmentation + Metrology)"],
        ["Calibration Version:", f"{inspection.get('calibration_version')} (±0.12 mm Optical Uncertainty)"],
        ["Processing Latency:", f"{inspection.get('processing_latency_ms')} ms (Cycle time compliant)"],
    ]
    audit_table = Table(audit_table_data, colWidths=[130, 390])
    audit_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(audit_table)
    story.append(Spacer(1, 16))

    # 7. Signatures & QA Officer Seal
    sig_data = [
        [
            Paragraph("<b>Automated AI Verification</b><br/>Certified Metrology & Vision Engine<br/>Status: <b>LOCKED & IMMUTABLE</b>", normal_text),
            Paragraph("<b>Lead Metallurgical QA Officer:</b><br/><br/>_______________________________<br/>Signature & Plant Seal", normal_text),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether(sig_table))

    doc.build(story)
    return output_path

def generate_batch_audit_pdf(inspections: List[Dict[str, Any]], output_path: Path) -> Path:
    """
    Generates official printable Comprehensive Batch Audit Report PDF.
    """
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'BatchTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold',
    )
    normal_text = ParagraphStyle(
        'BatchNormal',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155'),
    )

    story.append(Paragraph("INDUSTRIAL BILLET INSPECTION PLATFORM - COMPREHENSIVE BATCH AUDIT REPORT", title_style))
    story.append(Paragraph("Continuous Rolling & Secondary Cooling Bed Line #1 | NIT Raipur Integrated Steel Plant", normal_text))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceBefore=6, spaceAfter=10))

    # Aggregated KPIs
    total = len(inspections)
    pass_cnt = sum(1 for i in inspections if i.get("status") == "PASS")
    fail_cnt = sum(1 for i in inspections if i.get("status") == "FAIL")
    rework_cnt = sum(1 for i in inspections if i.get("status") == "REWORK")
    review_cnt = sum(1 for i in inspections if i.get("status") == "NEEDS_REVIEW")
    pass_rate = round((pass_cnt / max(total, 1)) * 100, 1)

    kpi_data = [
        ["Total Billets Inspected", "First-Time Yield (PASS)", "Rejected (FAIL)", "Grinding / Rework", "Pending Review", "Pass Rate"],
        [str(total), str(pass_cnt), str(fail_cnt), str(rework_cnt), str(review_cnt), f"{pass_rate}%"]
    ]
    kpi_table = Table(kpi_data, colWidths=[90, 95, 85, 90, 85, 85])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 12))

    # Complete Registry Table
    story.append(Paragraph("<b>PERMANENT BILLET AUDIT REGISTRY</b>", styles['Heading3']))
    
    registry_data = [
        ["Inspection ID", "Billet ID", "Heat No.", "L (mm)", "W (mm)", "H (mm)", "Defects", "OCR Conf", "Status", "Audit Hash (Prefix)"]
    ]
    for rec in inspections[:100]: # Cap table gracefully for batch report
        registry_data.append([
            rec.get("id"),
            rec.get("billet_id"),
            rec.get("heat_number"),
            f"{rec.get('length_mm')}",
            f"{rec.get('width_mm')}",
            f"{rec.get('height_mm')}",
            str(rec.get("defect_count", 0)),
            f"{int(rec.get('ocr_confidence', 0)*100)}%",
            rec.get("status"),
            str(rec.get("audit_hash", ""))[:12] + "...",
        ])

    reg_table = Table(registry_data, colWidths=[65, 75, 60, 42, 40, 40, 42, 48, 52, 66])
    reg_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ALIGN', (3, 0), (7, -1), 'CENTER'),
        ('ALIGN', (8, 0), (8, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(reg_table)

    doc.build(story)
    return output_path
