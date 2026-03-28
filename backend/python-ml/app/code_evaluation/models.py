from dataclasses import dataclass
from typing import List, Optional, Dict, Any


@dataclass
class CodeArtifact:
    language: str
    code: str
    source: str  # "docx_text" or "pdf_text" (trace)


@dataclass
class TestCase:
    name: str
    input_data: str
    expected_output: str


@dataclass
class CodeEvalRequestModel:
    submission_file: str
    answer_sheet_file: str
    max_marks: int = 100
    timeout_seconds: int = 5


@dataclass
class TestResult:
    test_name: str
    passed: bool
    actual_output: str
    expected_output: str
    stderr: str
    return_code: int


@dataclass
class CodeEvalResult:
    marks: int
    total_tests: int
    passed_tests: int
    language: str
    compile_or_run_ok: bool
    evidence: Dict[str, Any]