import re
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class GuideSection:
    code: str                 # "A", "B", "C", ...
    title: str                # "SYSTEM DESIGN"
    marks: int                # 45


class MarkingGuide:
    """
    Dynamic guide model.
    sections = {
        "A": {"title": "...", "marks": 15},
        "B": {"title": "...", "marks": 45},
        ...
    }
    """

    def __init__(self):
        self.sections: Dict[str, Dict[str, object]] = {}

    def add_section(self, code: str, title: str, marks: int) -> None:
        code = (code or "").strip().upper()
        title = (title or "").strip()
        self.sections[code] = {"title": title, "marks": int(marks)}

    def get_marks(self, code: str) -> int:
        item = self.sections.get(code.upper())
        return int(item["marks"]) if item else 0

    def total_marks(self) -> int:
        return sum(int(v["marks"]) for v in self.sections.values())


class MarkingGuideParser:
    """
    Extracts dynamic sections from lecturer guide text (DOCX/PDF already extracted).

    Supports headings like:
      SECTION A – REQUIREMENTS ENGINEERING (15 MARKS)
      SECTION B - SYSTEM DESIGN (45 MARKS)
      Section C: Implementation (20 marks)

    Also works if lecturer has more than F (G, H, ...).
    """

    SECTION_PATTERN = re.compile(
        r"""
        \bsection\s*        # 'section'
        ([a-z])             # section letter
        \s*                 # optional spaces
        [:\-–—]?            # optional separator
        \s*                 # optional spaces
        (.*?)               # title (non-greedy)
        \s*                 # optional spaces
        \(\s*               # opening (
        (\d{1,3})           # marks number
        \s*marks?\s*        # 'marks' or 'mark'
        \)                  # closing )
        """,
        re.IGNORECASE | re.VERBOSE
    )

    def parse(self, full_text: str) -> MarkingGuide:
        guide = MarkingGuide()

        if not full_text:
            return guide

        text = self._normalize(full_text)

        matches = list(self.SECTION_PATTERN.finditer(text))
        for m in matches:
            code = (m.group(1) or "").strip().upper()
            title = (m.group(2) or "").strip()
            marks = int(m.group(3))

            # Clean title a bit (remove extra separators)
            title = re.sub(r"\s{2,}", " ", title)
            title = title.strip(" -–—:\t")

            guide.add_section(code, title, marks)

        return guide

    def _normalize(self, t: str) -> str:
        # Keep newlines (helps other parsers), but normalize weird dashes
        t = t.replace("\r\n", "\n").replace("\r", "\n")
        t = t.replace("—", "-").replace("–", "-")
        return t