#!/usr/bin/env python3
"""Generate ZaLife DailyOS presentation PDF in Slovenian."""

from __future__ import annotations

import glob
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "presentation-assets"
OUTPUT = ROOT / "docs" / "ZaLife-DailyOS-Predstavitev.pdf"

PAGE_W, PAGE_H = landscape(A4)
MARGIN = 1.4 * cm

ACCENT = colors.HexColor("#EFA73B")
DARK = colors.HexColor("#15171C")
SURFACE = colors.HexColor("#2A2E37")
MUTED = colors.HexColor("#9AA0AD")
WHITE = colors.white

SLIDES = [
    {
        "num": 1,
        "title": "Prijava in registracija",
        "subtitle": "Vstop v gamificiran kokpit vodenja",
        "bullets": [
            "Prijava z Google računom ali e-pošto in geslom.",
            "Registracija novih udeležencev bootcampa.",
            "Pregled ključnih funkcij: XP, nivoji, Google Koledar in lestvica.",
            "Motivacijski citat za začetek dneva z disciplino.",
        ],
    },
    {
        "num": 2,
        "title": "Nadzorna plošča",
        "subtitle": "Tvoj dnevni kokpit vodenja",
        "bullets": [
            "Osebni pozdrav in stalni prikaz smisla življenja.",
            "Statistike tedna: XP, opravljene naloge, doslednost in niz dni.",
            "Dnevni cikel vodi skozi jutranji plan, check-in in večerno refleksijo.",
            "Hitre akcije za SMART cilje, AI mentorja in Mapo življenja.",
        ],
    },
    {
        "num": 3,
        "title": "Naloge",
        "subtitle": "Tedenski načrt izvedbe",
        "bullets": [
            "Pregled nalog po dnevih z navigacijo po tednih.",
            "Dodajanje nalog s prioriteto, ponavljanjem in trajanjem.",
            "Sinhronizacija z Google Koledarjem.",
            "Gamifikacija: visoka prioriteta prinaša več XP.",
        ],
    },
    {
        "num": 4,
        "title": "Jutranji Plan",
        "subtitle": "Temelji dneva pred 10:00",
        "bullets": [
            "Tri hvaležnosti za začetek dneva z zavedanjem.",
            "Top 3 cilji dneva z določenim trajanjem.",
            "Oddaja pred 10:00 prinaša +50 XP.",
            "Povezava z opoldanskim check-inom in dnevnim ciklom.",
        ],
    },
    {
        "num": 5,
        "title": "Opoldanski Check-In",
        "subtitle": "Preveri utrip in napredek",
        "bullets": [
            "Aktiven med 12:00 in 14:00 (z možnostjo testnega odklepa).",
            "Ocena počutja, energije in fokusa na drsnikih.",
            "Odkljukavanje napredka jutranjega plana.",
            "Oddaja check-ina prinaša +30 XP.",
        ],
    },
    {
        "num": 6,
        "title": "Večerna Refleksija",
        "subtitle": "Zaključi dan z resnico",
        "bullets": [
            "Aktivno ob 21:00 — zaključek dneva z iskrenostjo.",
            "Tri zmage dneva in misel ob koncu dneva.",
            "Oddaja je zaklenjena, dokler niso vpisane vse 3 zmage.",
            "Zaključek dneva prinaša +150 XP.",
        ],
    },
    {
        "num": 7,
        "title": "Mapa Življenja",
        "subtitle": "Celovita matrika življenja",
        "bullets": [
            "Štiri stebri: Zdravje, Odnosi, Finance in Čas.",
            "Ročna ocena 0–100 za vsako področje z opombami.",
            "Stalni banner smisla življenja in osebnih afirmacij.",
            "Temelj za dolgoročno vodenje in tedenske odločitve.",
        ],
    },
    {
        "num": 8,
        "title": "SMART Cilji",
        "subtitle": "Veliki cilji, jasno definirani",
        "bullets": [
            "Polja: Specifičen, Merljiv, Dosegljiv, Pomemben, Časovno določen.",
            "Vizualna nagrada, zakrita do dosega cilja.",
            "Vsak zaključen cilj = +500 XP.",
            "Pregled aktivnih in zaključenih ciljev.",
        ],
    },
    {
        "num": 9,
        "title": "Nedeljski Reset",
        "subtitle": "Obvezna tedenska evaluacija",
        "bullets": [
            "Pregled tedna: zaključeni %, opravljene naloge, doslednost.",
            "Refleksija: največja lekcija in kje si ostal v Driftu.",
            "Samocene iskrenosti in izvedbe (1–10).",
            "Zaključek tedna prinaša +300 XP; do večera je ostalo zaklenjeno.",
        ],
    },
    {
        "num": 10,
        "title": "Lestvica",
        "subtitle": "Tekmovanje med voditelji",
        "bullets": [
            "Rangiranje po XP tedna in nizu dni.",
            "Skrivnostna nagrada za zmagovalca bootcampa z odštevanjem.",
            "Pregled aktivnih voditeljev cikla in njihovega stanja FLOW/DRIFT.",
            "Spodbuda k doslednosti in skupnemu napredku.",
        ],
    },
    {
        "num": 11,
        "title": "Profil",
        "subtitle": "Tvoja identiteta in povezave",
        "bullets": [
            "Urejanje profilne slike, imena, starosti in e-pošte.",
            "Statistika: XP, nivo, niz, točke in SMART cilji.",
            "Povezava z Google Koledarjem za samodejno sinhronizacijo nalog.",
            "Osnova za personalizirano izkušnjo v aplikaciji.",
        ],
    },
    {
        "num": 12,
        "title": "Nadzorna Soba — Dostop",
        "subtitle": "Zaščiten super-admin vhod",
        "bullets": [
            "Ločen vhod na /admin, zaščiten z administratorsko kodo.",
            "Dostop samo za vodje bootcampa in super-administratorje.",
            "Hitra možnost vrnitve v glavno aplikacijo.",
            "Varnostna plast pred nepooblaščenim vpogledom.",
        ],
    },
    {
        "num": 13,
        "title": "Nadzorna Soba — Pregled",
        "subtitle": "Super-admin pregled vseh udeležencev",
        "bullets": [
            "Povzetek: število udeležencev, FLOW, DRIFT in zamudnih.",
            "Tabela z XP, nivojem, opozorili (n/5) in aktivnimi cilji.",
            "Hitro prepoznavanje udeležencev, ki potrebujejo pozornost.",
            "Celoten pregled stanja skupine na enem mestu.",
        ],
    },
    {
        "num": 14,
        "title": "Nadzorna Soba — Podrobnosti",
        "subtitle": "Globlji vpogled v posameznega udeleženca",
        "bullets": [
            "Skupni napredek, niz, opozorila, reseti in status zaklepa.",
            "Seznam aktivnih ciljev izbrane osebe.",
            "Mentor signal z opozorilom o stanju DRIFT in priporočili.",
            "Orodje za odgovorno vodenje in pravočasno intervencijo.",
        ],
    },
]


def find_image(num: int) -> Path:
    matches = sorted(ASSETS.glob(f"{num}-*.png"))
    if not matches:
        raise FileNotFoundError(f"Missing screenshot #{num} in {ASSETS}")
    return matches[0]


def register_fonts() -> None:
    # macOS system fonts with good Slovenian character support
    candidates = [
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "Arial"),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "Arial-Bold"),
        ("/Library/Fonts/Arial.ttf", "Arial"),
        ("/Library/Fonts/Arial Bold.ttf", "Arial-Bold"),
    ]
    for path, name in candidates:
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont(name, path))
    if "Arial" not in pdfmetrics.getRegisteredFontNames():
        # fallback to built-in Helvetica (limited but works)
        return


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    font = "Arial" if "Arial" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
    bold = "Arial-Bold" if "Arial-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"

    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName=bold,
            fontSize=34,
            leading=40,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName=font,
            fontSize=16,
            leading=22,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "section_num": ParagraphStyle(
            "section_num",
            parent=base["Normal"],
            fontName=bold,
            fontSize=11,
            textColor=ACCENT,
            spaceAfter=4,
        ),
        "section_title": ParagraphStyle(
            "section_title",
            parent=base["Heading1"],
            fontName=bold,
            fontSize=22,
            leading=26,
            textColor=WHITE,
            spaceAfter=4,
        ),
        "section_sub": ParagraphStyle(
            "section_sub",
            parent=base["Normal"],
            fontName=font,
            fontSize=12,
            leading=16,
            textColor=MUTED,
            spaceAfter=10,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName=font,
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#E8EAED"),
            leftIndent=12,
            bulletIndent=0,
            spaceAfter=5,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName=font,
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "intro": ParagraphStyle(
            "intro",
            parent=base["Normal"],
            fontName=font,
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#D8DCE3"),
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
    }


def draw_page_bg(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(SURFACE)
    canvas.roundRect(MARGIN * 0.6, MARGIN * 0.6, PAGE_W - 1.2 * MARGIN, PAGE_H - 1.2 * MARGIN, 10, fill=1, stroke=0)
    canvas.restoreState()


def on_page(canvas, doc) -> None:
    draw_page_bg(canvas, doc)
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_W - MARGIN, 8 * mm, f"ZaLife DailyOS · {canvas.getPageNumber()}")
    canvas.restoreState()


def cover_page(styles) -> list:
    story: list = []
    story.append(Spacer(1, 2.8 * cm))
    story.append(Paragraph("ZaLife DailyOS", styles["cover_title"]))
    story.append(Paragraph("Predstavitev aplikacije", styles["cover_sub"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(
        Paragraph(
            "Gamificiran kokpit vodenja za mladostnike v ZaLife Leadership Bootcampu.<br/>"
            "Dnevni ritmi, XP ekonomija, AI mentor in nadzorna soba za vodje.",
            styles["cover_sub"],
        )
    )
    story.append(Spacer(1, 1.2 * cm))

    features = [
        ["Dnevni OS", "Jutranji plan · Check-in · Refleksija · Nedeljski reset"],
        ["Rast", "Mapa življenja · SMART cilji · Dolgoročna vizija"],
        ["Skupnost", "Lestvica · Skrivnostna nagrada · Tekmovanje"],
        ["Integracije", "Google prijava · Google Koledar · AI Mentor"],
    ]
    table = Table(features, colWidths=[4.2 * cm, 18 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1F232B")),
                ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#CDD0D6")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#353A45")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 1.5 * cm))
    story.append(Paragraph("Jezik vmesnika: Slovenščina · PWA za namizje in mobilne naprave", styles["footer"]))
    story.append(PageBreak())
    return story


def intro_page(styles) -> list:
    story: list = []
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("O aplikaciji", styles["section_title"]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            "<b>ZaLife DailyOS</b> je produktivnostna PWA aplikacija, ki mladostnike vodi skozi "
            "strukturiran dnevni in tedenski ritem. Kombinira gamifikacijo (XP, nivoji, FLOW/DRIFT), "
            "osebno refleksijo, SMART cilje in AI mentorstvo v enoten vmesnik.",
            styles["intro"],
        )
    )
    story.append(
        Paragraph(
            "Aplikacija podpira Google prijavo in sinhronizacijo nalog z Google Koledarjem. "
            "Vodje bootcampa imajo na voljo zaščiteno <b>Nadzorno sobo</b> za spremljanje "
            "udeležencev, opozoril in napredka.",
            styles["intro"],
        )
    )
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Vsebina te predstavitve (14 zaslonov):", styles["section_sub"]))
    toc_lines = []
    for slide in SLIDES:
        toc_lines.append(f"<b>{slide['num']}.</b> {slide['title']} — <font color='#9AA0AD'>{slide['subtitle']}</font>")
    story.append(Paragraph("<br/>".join(toc_lines), styles["intro"]))
    story.append(PageBreak())
    return story


def feature_page(slide: dict, styles) -> list:
    story: list = []
    img_path = find_image(slide["num"])

    text_col_w = 8.8 * cm
    img_col_w = PAGE_W - 2 * MARGIN - text_col_w - 0.5 * cm
    img_h = PAGE_H - 2 * MARGIN - 0.4 * cm

    left = []
    left.append(Paragraph(f"Zaslon {slide['num']} / 14", styles["section_num"]))
    left.append(Paragraph(slide["title"], styles["section_title"]))
    left.append(Paragraph(slide["subtitle"], styles["section_sub"]))
    left.append(Spacer(1, 0.15 * cm))
    for bullet in slide["bullets"]:
        left.append(Paragraph(f"• {bullet}", styles["bullet"]))

    img = Image(str(img_path), width=img_col_w, height=img_h, kind="proportional")
    layout = Table([[left, img]], colWidths=[text_col_w, img_col_w])
    layout.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(layout)
    story.append(PageBreak())
    return story


def closing_page(styles) -> list:
    story: list = []
    story.append(Spacer(1, 3.5 * cm))
    story.append(Paragraph("ZaLife DailyOS", styles["cover_title"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(
        Paragraph(
            "„Disciplina je izbira med tem, kar si želiš zdaj,<br/>in tem, kar si želiš najbolj.“",
            styles["cover_sub"],
        )
    )
    story.append(Spacer(1, 1.2 * cm))
    story.append(
        Paragraph(
            "Hvala za pozornost.<br/>"
            "Za več informacij: zaženi aplikacijo lokalno z <font color='#EFA73B'>npm run dev</font> "
            "ali jo namesti kot PWA.",
            styles["cover_sub"],
        )
    )
    return story


def main() -> None:
    register_fonts()
    styles = build_styles()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=landscape(A4),
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="ZaLife DailyOS — Predstavitev",
        author="ZaLife",
    )

    story: list = []
    story.extend(cover_page(styles))
    story.extend(intro_page(styles))
    for slide in SLIDES:
        story.extend(feature_page(slide, styles))
    story.extend(closing_page(styles))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF created: {OUTPUT}")


if __name__ == "__main__":
    main()
