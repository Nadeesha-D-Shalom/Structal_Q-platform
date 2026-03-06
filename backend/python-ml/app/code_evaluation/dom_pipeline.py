from app.services.pdf_service import DocumentService
from app.code_evaluation.code_extractor import CodeExtractor
from app.code_evaluation.answer_sheet_parser import AnswerSheetParser
from app.code_evaluation.runners.dom_runner import DOMRunner
import re


class DOMCodeEvaluationPipeline:

    def __init__(self, submission_file: str, answer_sheet_file: str):
        self.submission_file = submission_file
        self.answer_sheet_file = answer_sheet_file

        self.doc_service = DocumentService()
        self.extractor = CodeExtractor()
        self.answer_parser = AnswerSheetParser()
        self.runner = DOMRunner()

    def run(self):

        submission_text = self.doc_service.extract_text(self.submission_file)
        answer_text = self.doc_service.extract_text(self.answer_sheet_file)

        # -------------------------------------
        # Extract Marks from Lecturer Sheet
        # -------------------------------------
        full_marks_match = re.search(r"Full\s*Marks:\s*(\d+)", answer_text)
        compile_match = re.search(r"Compile:\s*(\d+)", answer_text)
        correct_match = re.search(r"Correct\s*output:\s*(\d+)", answer_text)

        total_marks = int(full_marks_match.group(1)) if full_marks_match else 10
        compile_marks = int(compile_match.group(1)) if compile_match else 1
        correct_marks = int(correct_match.group(1)) if correct_match else (total_marks - compile_marks)

        code_blocks = self.extractor.extract(submission_text)

        if not code_blocks:
            return {
                "marks": 0,
                "total_marks": total_marks,
                "error": "No JS code found."
            }

        tests = self.answer_parser.parse_tests(answer_text)

        # ---------------------------------
        # NO TEST CASES → COMPILE MODE
        # ---------------------------------
        if not tests:

            for artifact in code_blocks:

                alert_output = self.runner.execute(
                    artifact.code,
                    {"name": "", "age": "", "email": "", "phone": ""}
                )

                if alert_output:

                    return {
                        "marks": compile_marks,
                        "total_marks": total_marks,
                        "compile_marks_awarded": True,
                        "evaluation_type": "DOM_compile_only"
                    }

            return {
                "marks": 0,
                "total_marks": total_marks,
                "compile_marks_awarded": False,
                "evaluation_type": "DOM_compile_only"
            }

        # ---------------------------------
        # REAL TEST MODE
        # ---------------------------------
        best_score = 0
        passed_tests = 0
        total_tests = len(tests)

        for artifact in code_blocks:

            passed = 0

            for test in tests:

                alert_output = self.runner.execute(
                    artifact.code,
                    test.input_data
                )

                if alert_output.strip() == test.expected_output.strip():
                    passed += 1

            score = int((passed / total_tests) * correct_marks)

            if score > best_score:
                best_score = score
                passed_tests = passed

        final_score = best_score + compile_marks

        return {
            "marks": final_score,
            "total_marks": total_marks,
            "passed_tests": passed_tests,
            "total_tests": total_tests,
            "evaluation_type": "DOM"
        }