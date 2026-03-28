from app.services.pdf_service import DocumentService
from app.code_evaluation.code_extractor import CodeExtractor
from app.code_evaluation.language_detector import LanguageDetector
from app.code_evaluation.answer_sheet_parser import AnswerSheetParser
from app.code_evaluation.evaluator import CodeEvaluator
from app.code_evaluation.runners.runner_factory import RunnerFactory


class CodeEvaluationPipeline:

    def __init__(self, submission_file: str, answer_sheet_file: str, max_marks: int = 100, timeout_seconds: int = 5):
        self.submission_file = submission_file
        self.answer_sheet_file = answer_sheet_file
        self.max_marks = int(max_marks)
        self.timeout_seconds = int(timeout_seconds)

        self.doc_service = DocumentService()
        self.code_extractor = CodeExtractor()
        self.lang_detector = LanguageDetector()
        self.answer_parser = AnswerSheetParser()
        self.evaluator = CodeEvaluator()

    def run(self):

        submission_text = self.doc_service.extract_text(self.submission_file)
        answer_text = self.doc_service.extract_text(self.answer_sheet_file)

        code_blocks = self.code_extractor.extract(submission_text)
        if not code_blocks:
            return {
                "marks": 0,
                "error": "No code blocks detected."
            }

        tests = self.answer_parser.parse_tests(answer_text)

        best_result = None

        for artifact in code_blocks:

            language = self.lang_detector.detect(artifact.code, artifact.language)

            try:
                runner = RunnerFactory.get_runner(language, timeout_seconds=self.timeout_seconds)
            except Exception:
                continue

            # -----------------------------
            # CASE 1 — No test cases
            # -----------------------------
            if not tests:

                run_result = runner.execute(artifact.code)

                compile_ok = bool(run_result.get("success", False))

                # BASIC LOGIC CHECK (avoid empty valid JS)
                basic_logic_ok = False

                if language == "javascript":
                    if "function" in artifact.code and "alert(" in artifact.code:
                        basic_logic_ok = True
                else:
                    basic_logic_ok = compile_ok

                marks = 1 if (compile_ok and basic_logic_ok) else 0

                return {
                    "marks": marks,
                    "language": language,
                    "compile_or_run_ok": compile_ok,
                    "evidence": {
                        "compile_only_mode": True,
                        "stderr": run_result.get("stderr", ""),
                        "return_code": run_result.get("return_code", 0)
                    }
                }

            # -----------------------------
            # CASE 2 — Real test cases
            # -----------------------------
            ok, test_results = self.evaluator.evaluate(runner, artifact.code, tests)

            passed = sum(1 for t in test_results if t.passed)
            total = len(test_results)

            ratio = passed / total if total > 0 else 0
            marks = int(round(ratio * self.max_marks))

            candidate = {
                "marks": marks,
                "passed": passed,
                "total": total,
                "language": language,
                "ok": ok,
                "test_results": test_results,
                "source": artifact.source
            }

            if best_result is None or candidate["marks"] > best_result["marks"]:
                best_result = candidate

        if not best_result:
            return {
                "marks": 0,
                "error": "No supported runner found."
            }

        return {
            "marks": best_result["marks"],
            "language": best_result["language"],
            "compile_or_run_ok": best_result["ok"],
            "passed_tests": best_result["passed"],
            "total_tests": best_result["total"],
            "evidence": [
                {
                    "name": t.test_name,
                    "passed": t.passed,
                    "stderr": t.stderr,
                    "return_code": t.return_code
                }
                for t in best_result["test_results"]
            ]
        }