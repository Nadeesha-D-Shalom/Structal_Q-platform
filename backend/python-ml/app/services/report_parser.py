import re
from app.services.pdf_service import DocumentService


class ParsedReport:

    def __init__(self):
        self.full_text = ""

        # Basic counts
        self.fr_count = 0
        self.nfr_count = 0
        self.entity_count = 0
        self.relationship_count = 0
        self.actor_count = 0
        self.ui_count = 0

        # Diagram sections
        self.has_architecture_section = False
        self.has_usecase_section = False
        self.has_er_section = False

        # Testing
        self.has_testing_section = False
        self.has_validation_section = False
        self.has_test_table = False
        self.test_case_count = 0

        # Individual Contribution
        self.has_individual_section = False
        self.member_name_count = 0
        self.individual_word_count = 0

        # Boilerplate detection
        self.unique_word_ratio = 0


class ReportParser:

    def __init__(self):
        self.doc_service = DocumentService()

    def parse(self, file_path: str):

        text = self.doc_service.extract_text(file_path)
        parsed = ParsedReport()
        parsed.full_text = text

        lower_text = text.lower()

        # -----------------------
        # Basic Counts
        # -----------------------
        parsed.fr_count = text.count("FR-")
        parsed.nfr_count = text.count("NFR-")
        parsed.entity_count = text.count("PK")
        parsed.relationship_count = text.count("→")
        parsed.actor_count = text.count("Stakeholder:")
        parsed.ui_count = text.count("Dashboard") + text.count("Page")

        # -----------------------
        # Diagram Sections
        # -----------------------
        parsed.has_architecture_section = "system architecture diagram" in lower_text
        parsed.has_usecase_section = "use case diagram" in lower_text
        parsed.has_er_section = "er / eer diagram" in lower_text or "er diagram" in lower_text

        # -----------------------
        # STRICT TESTING DETECTION
        # -----------------------
        parsed.has_testing_section = bool(
            re.search(r"\bsection\s*e\b.*testing", lower_text) or
            re.search(r"\n\s*\d+(\.\d+)?\s+testing\b", lower_text)
        )

        parsed.has_validation_section = bool(
            re.search(r"\n\s*\d+(\.\d+)?\s+validation\b", lower_text)
        )

        parsed.test_case_count = len(
            re.findall(r"\btest\s*case\s*\d+", lower_text)
        )

        parsed.has_test_table = all(
            keyword in lower_text
            for keyword in ["test case id", "expected result", "actual result"]
        )

        # -----------------------
        # Individual Contribution
        # -----------------------
        parsed.has_individual_section = bool(
            re.search(r"individual contribution|member contribution", lower_text)
        )

        parsed.member_name_count = len(
            re.findall(r"member\s*\d+", lower_text)
        )

        if parsed.has_individual_section:
            match = re.search(
                r"(individual contribution.*?)(\n\d+\.|\Z)",
                lower_text,
                re.DOTALL
            )
            if match:
                parsed.individual_word_count = len(match.group(1).split())

        # -----------------------
        # Boilerplate Detection
        # -----------------------
        words = re.findall(r"\b\w+\b", lower_text)
        unique_words = set(words)

        if words:
            parsed.unique_word_ratio = len(unique_words) / len(words)

        return parsed