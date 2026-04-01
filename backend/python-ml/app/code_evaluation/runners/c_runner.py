import os
from app.code_evaluation.runners.base_runner import BaseRunner


class CRunner(BaseRunner):

    def _write_source_file(self, tmpdir: str, code: str) -> str:
        path = os.path.join(tmpdir, "main.c")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
        return path

    def _run(self, source_path: str, tmpdir: str, input_data: str):

        compile_result = self._safe_subprocess(["gcc", source_path, "-o", "program"], cwd=tmpdir)
        if not compile_result["success"]:
            return compile_result

        exe = "program.exe" if os.name == "nt" else "./program"
        return self._safe_subprocess([exe], cwd=tmpdir, input_data=input_data)