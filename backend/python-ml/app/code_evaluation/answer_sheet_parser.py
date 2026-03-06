import re
from typing import List
from app.code_evaluation.models import TestCase


class AnswerSheetParser:

    TEST_RE = re.compile(
        r"TESTCASE\s*(\d+)([\s\S]*?)(?=TESTCASE\s*\d+|$)",
        re.IGNORECASE
    )

    def parse_tests(self, full_text: str) -> List[TestCase]:
        if not full_text:
            return []

        tests: List[TestCase] = []
        for m in self.TEST_RE.finditer(full_text):
            idx = m.group(1)
            body = m.group(2) or ""

            input_data = self._extract_block(body, "INPUT")
            expected = self._extract_block(body, "OUTPUT")

            if expected is None:
                continue

            tests.append(TestCase(
                name=f"TESTCASE_{idx}",
                input_data=(input_data or "").strip(),
                expected_output=(expected or "").strip()
            ))

        return tests

    def _extract_block(self, body: str, key: str):
        p = re.compile(rf"{key}\s*:\s*([\s\S]*?)(?=\n[A-Z ]+\s*:|\Z)", re.IGNORECASE)
        m = p.search(body.strip() + "\n")
        return m.group(1).strip() if m else None

