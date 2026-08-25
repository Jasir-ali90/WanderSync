"""Exports: branded PDF (ReportLab) and ICS calendar generation."""
from datetime import datetime, timedelta
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BRAND_TEAL = colors.HexColor("#0d9488")
BRAND_DARK = colors.HexColor("#0c1220")
INK = colors.HexColor("#334155")
SAND = colors.HexColor("#e8c489")


def build_trip_pdf_bytes(trip) -> bytes:
    """Render a WanderSync-branded PDF for a trip."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title=f"{trip.title} — WanderSync",
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("BrandH2", parent=styles["Heading2"], fontName="Helvetica-Bold", textColor=BRAND_TEAL, fontSize=13, spaceAfter=6))
    styles.add(ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=13, textColor=INK))
    styles.add(ParagraphStyle("Muted", parent=styles["BodyText"], fontName="Helvetica-Oblique", fontSize=8, textColor=colors.grey))

    story = []
    # Header band
    story.append(Paragraph(f"<font color='#0d9488'><b>Wander</b>Sync</font>", styles["Body"]))
    story.append(Paragraph(f"<font color='#0c1220'><b>{trip.title}</b></font>", styles["Heading1"]))
    story.append(Paragraph(
        f"{trip.destination} &nbsp;·&nbsp; {trip.duration_days} days"
        f" &nbsp;·&nbsp; {trip.travelers} traveller{'s' if trip.travelers != 1 else ''}",
        styles["Muted"],
    ))
    story.append(Spacer(1, 4 * mm))

    # Summary table
    summary = Table(
        [
            ["Budget", "Est. total", "Optimization"],
            [
                f"{trip.budget_amount or '—'} {trip.budget_currency}" if trip.budget_amount else "—",
                f"{trip.itinerary.total_estimated_cost():,.0f} {trip.budget_currency}",
                f"{trip.optimization_score}/100" if trip.optimization_score is not None else "—",
            ],
        ],
        colWidths=[50 * mm, 50 * mm, 50 * mm],
    )
    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, 1), 10),
        ("FONTSIZE", (0, 1), (-1, 1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, 1), [colors.HexColor("#f1f5f9"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
        ("BOX", (0, 0), (-1, -1), 0.6, BRAND_TEAL),
    ]))
    story.append(summary)
    story.append(Spacer(1, 6 * mm))

    # Per-day itinerary
    for day in trip.itinerary.days:
        story.append(Paragraph(
            f"Day {day.day_number} — {day.title or ''}".strip(), styles["BrandH2"],
        ))
        data = [["Time", "Activity", "Duration", "Category", "Est. cost"]]
        rows = []
        for activity in day.activities:
            rows.append([
                activity.start_time or "—",
                Paragraph(activity.name, styles["Body"]),
                f"{activity.duration_minutes}m",
                activity.category,
                f"{activity.cost_estimate:,.0f} {trip.budget_currency}" if activity.cost_estimate else "—",
            ])
        if rows:
            table = Table([data[0], *rows], colWidths=[15 * mm, 70 * mm, 20 * mm, 22 * mm, 23 * mm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), SAND),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
                ("ALIGN", (4, 0), (4, -1), "RIGHT"),
            ]))
            story.append(table)
        story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Costs are estimates and not guaranteed prices.", styles["Muted"]))
    story.append(Paragraph("Planned with WanderSync — your AI travel companion.", styles["Muted"]))

    doc.build(story)
    return buffer.getvalue()


def build_trip_ics(trip) -> str:
    """A multi-event ICS calendar covering every scheduled activity."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//WanderSync//WanderSync//EN",
        "CALSCALE:GREGORIAN",
    ]
    sequence = 0
    for day in trip.itinerary.days:
        date = day.date
        for activity in day.activities:
            start = activity.start_time or "09:00"
            hour, minute = start.split(":")
            start_dt = datetime.combine(date, (datetime.min.replace(hour=int(hour), minute=int(minute))).time()) if date else None
            if start_dt is None:
                continue
            end_dt = start_dt + timedelta(minutes=max(15, activity.duration_minutes or 60))
            lines.extend([
                "BEGIN:VEVENT",
                f"UID:wandersync-{trip.id}-{day.day_number}-{sequence}@wandersync",
                f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}",
                f"DTEND:{end_dt.strftime('%Y%m%dT%H%M%S')}",
                f"SUMMARY:{_escape(activity.name)}",
                f"LOCATION:{_escape(activity.location_name or trip.destination)}",
                "END:VEVENT",
            ])
            sequence += 1
    lines.append("END:VCALENDAR")
    return ("\r\n".join(lines) + "\r\n").encode("utf-8")


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", " ")