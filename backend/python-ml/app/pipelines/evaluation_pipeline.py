from app.services.report_parser import ReportParser
from app.services.marking_guide_parser import MarkingGuideParser
from app.services.pdf_service import DocumentService
from app.services.scoring_engine import ScoringEngine
from app.services.diagram_validator import DiagramValidator


class EvaluationPipeline:

    def __init__(self, student_file: str, guide_file: str, similarity_service):
        self.student_file = student_file
        self.guide_file = guide_file

        self.report_parser = ReportParser()
        self.guide_parser = MarkingGuideParser()
        self.doc_service = DocumentService()
        self.diagram_service = DiagramValidator()
        self.scoring_engine = ScoringEngine()
        self.similarity_service = similarity_service

    def run(self):

        # 1. Parse Student Report
        parsed_report = self.report_parser.parse(self.student_file)

        # 2. Parse Lecturer Marking Guide
        guide_text = self.doc_service.extract_text(self.guide_file)
        guide = self.guide_parser.parse(guide_text)

        if not guide.sections:
            return {
                "error": "No valid sections detected in marking guide.",
                "final_score": 0
            }

        # 3. Diagram Validation (OCR + Signals)
        diagram_analysis = self.diagram_service.validate(
            self.student_file,
            parsed_report.full_text
        )

        # 4. Semantic Similarity (Student vs Guide)
        similarity_score = self.similarity_service.compute_similarity(
            parsed_report.full_text,
            guide_text
        )

        # 5. Dynamic Scoring
        results = self.scoring_engine.evaluate(
            parsed_report,
            diagram_analysis,
            guide
        )

        # 6. Attach Additional Metadata
        results["semantic_similarity"] = similarity_score
        results["guide_weights"] = guide.sections
        results["diagram_analysis"] = diagram_analysis

        return results