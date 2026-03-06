import re
from typing import List
from app.code_evaluation.models import CodeArtifact


class CodeExtractor:

    def extract(self, full_text: str) -> List[CodeArtifact]:

        if not full_text:
            return []

        artifacts: List[CodeArtifact] = []

        text = full_text.strip()

        # Detect fenced blocks (```js)
        fence_pattern = re.compile(r"```(\w+)?\s*([\s\S]*?)```", re.MULTILINE)
        for m in fence_pattern.finditer(text):
            lang = (m.group(1) or "").strip().lower()
            code = (m.group(2) or "").strip()
            if code:
                artifacts.append(CodeArtifact(language=lang or "unknown", code=code, source="fence"))

        if artifacts:
            return artifacts

        # Strong JavaScript detection
        js_signatures = [
            "document.getElementById",
            "function ",
            "alert(",
            "const ",
            "let ",
            "var ",
            "=>"
        ]

        js_hits = sum(1 for sig in js_signatures if sig in text)

        if js_hits >= 2:
            artifacts.append(CodeArtifact(
                language="javascript",
                code=text,
                source="full_text_js_detected"
            ))
            return artifacts

        # Python detection
        if "def " in text or "print(" in text:
            artifacts.append(CodeArtifact(
                language="python",
                code=text,
                source="full_text_python_detected"
            ))
            return artifacts

        # C detection
        if "#include" in text and "int main" in text:
            artifacts.append(CodeArtifact(
                language="c",
                code=text,
                source="full_text_c_detected"
            ))
            return artifacts

        #  Java detection
        if "public class" in text:
            artifacts.append(CodeArtifact(
                language="java",
                code=text,
                source="full_text_java_detected"
            ))
            return artifacts

        return []