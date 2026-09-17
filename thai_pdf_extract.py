#!/usr/bin/env python3
"""
Reliable text extraction for Thai government/legal PDFs (ราชกิจจานุเบกษา,
Council of State consolidations, user's own scanned/exported working copies).

Why this exists: markitdown and most plain-text PDF extractors (pdfminer,
PyPDF, etc.) read a font's ToUnicode CMap literally. Several Thai legal PDFs
ship fonts (commonly TH SarabunPSK / THSarabunNew subsets) whose CMap is
broken in ways that corrupt exactly the characters that matter for reading
law text correctly — vowels and tone marks — while leaving the surrounding
consonants readable. This makes the corruption easy to miss at a glance and
easy to mistake for "the file is fine, just needs OCR."

Two known corruption patterns, both fixed here automatically:

1. PUA-block remap: ไม้เอก/โท/ตรี/จัตวา, ไม้ไต่คู้, some สระ decode into the
   Private Use Area (U+F700 block) instead of their real Unicode codepoints.
   Documented Thai-font PDF issue (see github.com/bact/constitution).
2. สระอำ-as-space: the ำ glyph (stored decomposed as ํ + า, matching this
   codebase's own house style) decodes as a literal U+0020 space instead of
   ํ (U+0E4D, nikhahit) — invisible in casual review, breaks almost every
   other word ("กระทำ" -> "กระท ำ"-looking mush, "คำ" -> "ค ำ"). Detected
   reliably via glyph bbox width: a real space in these fonts is ~3.6-3.7pt
   wide; the corrupted สระอำ space is exactly 0.0pt (zero-width) because the
   font never actually draws a "space" glyph there — rawdict just reports
   the CMap's (wrong) character for a mark that occupies no width of its
   own. This signal is deterministic — no font size/DPI tuning needed.

Usage:
    python thai_pdf_extract.py somefile.pdf                  # dump all pages
    python thai_pdf_extract.py somefile.pdf --pages 2-14      # page range
    python thai_pdf_extract.py somefile.pdf --debug           # show x0/font per line

Programmatic use (for a script that then does its own มาตรา/วรรค
segmentation — segmentation signals vary per PDF and are NOT generalized
here, see docs/CODEX_EXTRACTION_GUIDE.md and reference notes for per-book
decisions):

    from thai_pdf_extract import extract_lines
    lines = extract_lines("somefile.pdf")   # -> list[Line]
    for ln in lines:
        print(ln.page, ln.x0, ln.font, ln.text)

Each Line also exposes `.is_bold` (True if the font name contains "Bold")
for PDFs that signal มาตรา headers vs. inline cross-references by font
weight rather than indentation (seen in some older Council-of-State PDFs;
see reference_codex_data_pipeline memory for when to use which signal).
"""

import argparse
import sys
from dataclasses import dataclass

import fitz  # PyMuPDF

PUA_REMAP = {
    0xF701: 0x0E34, 0xF702: 0x0E35, 0xF703: 0x0E36, 0xF704: 0x0E37,
    0xF705: 0x0E48, 0xF706: 0x0E49, 0xF70A: 0x0E48, 0xF70B: 0x0E49,
    0xF70E: 0x0E4C, 0xF710: 0x0E31, 0xF712: 0x0E47, 0xF713: 0x0E48,
    0xF714: 0x0E49,
}

SARA_AM_FIX = "ํ"  # นิคหิต — what a corrupted สระอำ space should be
ZERO_WIDTH_THRESHOLD = 0.5  # pt; real spaces in these fonts run ~3.6-3.7pt


@dataclass
class Line:
    page: int          # 1-indexed
    x0: float           # left edge, for indent-based header/วรรค detection
    text: str           # already fixed (PUA remap + สระอำ)
    font: str           # last span's font name on this line
    is_bold: bool       # True if any span on this line has a "Bold" font


def _fix_char(c: str, width: float) -> str:
    o = ord(c)
    if o in PUA_REMAP:
        return chr(PUA_REMAP[o])
    if c == " " and width < ZERO_WIDTH_THRESHOLD:
        return SARA_AM_FIX
    return c


def extract_lines(pdf_path: str, first_page: int | None = None, last_page: int | None = None) -> list[Line]:
    """Extract every physical text line, char-level-corrected.

    Page numbers are 1-indexed and inclusive, matching how PDF viewers show
    them (unlike PyMuPDF's own 0-indexed page objects).
    """
    doc = fitz.open(pdf_path)
    lo = (first_page - 1) if first_page else 0
    hi = last_page if last_page else doc.page_count
    lines: list[Line] = []
    for pno in range(lo, hi):
        page = doc[pno]
        d = page.get_text("rawdict")
        for block in d["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                x0 = line["bbox"][0]
                text = ""
                font = ""
                bold = False
                for span in line["spans"]:
                    font = span.get("font", "")
                    if "bold" in font.lower():
                        bold = True
                    for ch in span["chars"]:
                        w = ch["bbox"][2] - ch["bbox"][0]
                        text += _fix_char(ch["c"], w)
                text = text.strip()
                if not text:
                    continue
                lines.append(Line(page=pno + 1, x0=x0, text=text, font=font, is_bold=bold))
    return lines


def _parse_page_range(spec: str) -> tuple[int, int]:
    if "-" in spec:
        a, b = spec.split("-", 1)
        return int(a), int(b)
    n = int(spec)
    return n, n


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf_path")
    ap.add_argument("--pages", help="e.g. 2-14 or 5 (1-indexed, inclusive)")
    ap.add_argument("--debug", action="store_true", help="prefix each line with [page|x0|font]")
    args = ap.parse_args()

    first, last = (None, None)
    if args.pages:
        first, last = _parse_page_range(args.pages)

    lines = extract_lines(args.pdf_path, first, last)
    out = sys.stdout
    if hasattr(out, "reconfigure"):
        out.reconfigure(encoding="utf-8")  # Windows console defaults to cp874 and mangles Thai
    for ln in lines:
        if args.debug:
            b = "B" if ln.is_bold else " "
            out.write(f"[p{ln.page}|{ln.x0:6.1f}|{b}|{ln.font}] {ln.text}\n")
        else:
            out.write(ln.text + "\n")


if __name__ == "__main__":
    main()
