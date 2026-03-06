import os
from app.code_evaluation.runners.base_runner import BaseRunner


class NodeRunner(BaseRunner):

    def _write_source_file(self, tmpdir: str, code: str) -> str:
        path = os.path.join(tmpdir, "main.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
        return path

    def _run(self, source_path: str, tmpdir: str, input_data: str):
        return self._safe_subprocess(["node", source_path], cwd=tmpdir, input_data=input_data)