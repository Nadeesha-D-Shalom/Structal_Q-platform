from app.ml.grading_model import GradingModel
from app.ml.feature_builder import FeatureBuilder
from app.ml.confidence_calculator import ConfidenceCalculator
from app.ml.anomaly_detector import AnomalyDetector

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

        # ML components
        self.feature_builder = FeatureBuilder()
        self.grading_model = GradingModel()
        self.confidence_calculator = ConfidenceCalculator()
        self.anomaly_detector = AnomalyDetector()

    def run(self):

        # 1. Parse Student Report
        parsed_report = self.report_parser.parse(self.student_file)

        # 2. Parse Lecturer Marking Guide
        guide_text = self.doc_service.extract_text(self.guide_file)
        guide = self.guide_parser.parse(guide_text)

        if not guide.sections:
            return {
                "error": "No valid sections detected in marking guide.",
                "final_score": 0,
                "features": {}
            }

        # 3. Diagram Validation
        diagram_analysis = self.diagram_service.validate(
            self.student_file,
            parsed_report.full_text
        )

        # 4. Semantic Similarity
        similarity_score = self.similarity_service.compute_similarity(
            parsed_report.full_text,
            guide_text
        )

        # 5. Rule-based Scoring
        results = self.scoring_engine.evaluate(
            parsed_report,
            diagram_analysis,
            guide
        )

        # 6. Extract values
        final_score = results.get("final_score", 0)
        keyword_score = results.get("keyword_score", 0)
        structure_score = results.get("structure_score", 0)

        total_questions = len(guide.sections)
        answered_questions = total_questions if parsed_report.full_text.strip() else 0

        diagram_score = 0
        if isinstance(diagram_analysis, dict):
            diagram_score = diagram_analysis.get("diagram_score", 0)

        # 7. Build Features
        features = self.feature_builder.build_report_features(
            student_text=parsed_report.full_text,
            keyword_score=keyword_score,
            semantic_score=similarity_score,
            structure_score=structure_score,
            diagram_score=diagram_score,
            ocr_confidence=0,
            plagiarism_risk=similarity_score,
            total_questions=total_questions,
            answered_questions=answered_questions,
            final_rule_based_score=final_score
        )

        # 8. ML Prediction
        try:
            predicted_score = self.grading_model.predict(features)
        except Exception:
            predicted_score = final_score

        # 9. Hybrid Score
        final_ai_score = (0.7 * predicted_score) + (0.3 * final_score)

        # 10. Confidence Score
        confidence_score = self.confidence_calculator.calculate(
            features=features,
            rule_based_score=final_score,
            ml_predicted_score=predicted_score
        )

        # 11. Risk Detection (NEW)
        risk_result = self.anomaly_detector.predict(features)

        # 12. Attach Results
        results["rule_based_score"] = final_score
        results["ml_predicted_score"] = predicted_score
        results["final_score"] = round(final_ai_score, 2)
        results["confidence_score"] = confidence_score

        results["risk_score"] = risk_result["risk_score"]
        results["is_anomaly"] = risk_result["is_anomaly"]

        results["semantic_similarity"] = similarity_score
        results["guide_weights"] = guide.sections
        results["diagram_analysis"] = diagram_analysis
        results["features"] = features

        return results