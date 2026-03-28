from app.code_evaluation.runners.python_runner import PythonRunner
from app.code_evaluation.runners.c_runner import CRunner
from app.code_evaluation.runners.java_runner import JavaRunner
from app.code_evaluation.runners.node_runner import NodeRunner


class RunnerFactory:

    @staticmethod
    def get_runner(language: str, timeout_seconds: int = 5):

        lang = (language or "").lower().strip()

        if lang == "python":
            return PythonRunner(timeout_seconds)

        if lang == "c":
            return CRunner(timeout_seconds)

        if lang == "java":
            return JavaRunner(timeout_seconds)

        if lang in ["javascript", "js", "node", "nodejs"]:
            return NodeRunner(timeout_seconds)

        raise ValueError(f"No runner implemented for language='{language}'")