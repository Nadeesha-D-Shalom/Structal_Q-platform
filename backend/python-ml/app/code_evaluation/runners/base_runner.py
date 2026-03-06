import subprocess
import tempfile
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class BaseRunner(ABC):

    def __init__(self, timeout_seconds: int = 5):
        self.timeout_seconds = timeout_seconds

    def execute(self, code: str, input_data: str = "") -> Dict[str, Any]:
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = self._write_source_file(tmpdir, code)
            return self._run(source_path, tmpdir, input_data)

    @abstractmethod
    def _write_source_file(self, tmpdir: str, code: str) -> str:
        pass

    @abstractmethod
    def _run(self, source_path: str, tmpdir: str, input_data: str) -> Dict[str, Any]:
        pass

    def _safe_subprocess(self, command: List[str], cwd: str, input_data: str = "") -> Dict[str, Any]:
        try:
            result = subprocess.run(
                command,
                input=input_data,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                cwd=cwd,
                shell=False
            )
            return {
                "success": result.returncode == 0,
                "stdout": (result.stdout or "").strip(),
                "stderr": (result.stderr or "").strip(),
                "return_code": int(result.returncode)
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Execution timed out",
                "return_code": -1
            }