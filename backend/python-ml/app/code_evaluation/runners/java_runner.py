import os
import re
from app.code_evaluation.runners.base_runner import BaseRunner


class JavaRunner(BaseRunner):

    def _write_source_file(self, tmpdir: str, code: str) -> str:
        class_name = self._detect_public_class_name(code) or "Main"
        path = os.path.join(tmpdir, f"{class_name}.java")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
        return path

    def _run(self, source_path: str, tmpdir: str, input_data: str):

        compile_result = self._safe_subprocess(["javac", source_path], cwd=tmpdir)
        if not compile_result["success"]:
            return compile_result

        class_file = os.path.basename(source_path).replace(".java", "")
        return self._safe_subprocess(["java", class_file], cwd=tmpdir, input_data=input_data)

    def _detect_public_class_name(self, code: str):
        m = re.search(r"public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)", code)
        return m.group(1) if m else None

    