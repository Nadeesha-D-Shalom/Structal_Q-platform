from app.services.report_parser import ReportParser
from app.services.marking_guide_parser import MarkingGuideParser
from app.services.pdf_service import DocumentService
from app.services.scoring_engine import ScoringEngine
from app.services.diagram_validator import DiagramValidator


class EvaluationPipeline:

    def __init__(self, student_file: str, guide_file: str):
        self.student_file = student_file
        self.guide_file = guide_file

        self.report_parser = ReportParser()
        self.guide_parser = MarkingGuideParser()
        self.doc_service = DocumentService()
        self.diagram_service = DiagramValidator()
        self.scoring_engine = ScoringEngine()

    def run(self):

        # 1️⃣ Parse student report
        parsed_report = self.report_parser.parse(self.student_file)

        # 2️⃣ Parse lecturer guide
        guide_text = self.doc_service.extract_text(self.guide_file)
        guide = self.guide_parser.parse(guide_text)

        # 3️⃣ Validate diagrams (correct call)
        diagram_analysis = self.diagram_service.validate(
            self.student_file,
            parsed_report.full_text
        )

        # 4️⃣ Score dynamically
        results = self.scoring_engine.evaluate(
            parsed_report,
            diagram_analysis,
            guide
        )

        results["guide_weights"] = guide.sections
        results["diagram_analysis"] = diagram_analysis

        return results