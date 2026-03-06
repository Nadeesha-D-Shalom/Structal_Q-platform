from typing import List, Tuple
from app.code_evaluation.models import TestCase, TestResult


class CodeEvaluator:

    def evaluate(self, runner, code: str, tests: List[TestCase]) -> Tuple[bool, List[TestResult]]:

        results: List[TestResult] = []

        if not tests:
            run_once = runner.execute(code, input_data="")
            ok = bool(run_once.get("success", False))
            results.append(TestResult(
                test_name="NO_TESTS_RUN_SINGLE_EXEC",
                passed=ok,
                actual_output=run_once.get("stdout", ""),
                expected_output="",
                stderr=run_once.get("stderr", ""),
                return_code=int(run_once.get("return_code", 0))
            ))
            return ok, results

        all_ok = True
        for t in tests:
            r = runner.execute(code, input_data=t.input_data or "")
            actual = (r.get("stdout", "") or "").strip()
            expected = (t.expected_output or "").strip()

            passed = bool(r.get("success", False)) and self._normalize(actual) == self._normalize(expected)
            if not passed:
                all_ok = False

            results.append(TestResult(
                test_name=t.name,
                passed=passed,
                actual_output=actual,
                expected_output=expected,
                stderr=r.get("stderr", ""),
                return_code=int(r.get("return_code", 0))
            ))

        return all_ok, results

    def _normalize(self, s: str) -> str:
        return "\n".join(line.rstrip() for line in (s or "").strip().splitlines()).strip()