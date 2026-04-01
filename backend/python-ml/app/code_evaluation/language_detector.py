import re


class LanguageDetector:

    def detect(self, code: str, hint: str = "") -> str:
        h = (hint or "").lower().strip()
        if h in ["python", "py"]:
            return "python"
        if h in ["java"]:
            return "java"
        if h in ["c"]:
            return "c"
        if h in ["js", "javascript", "node", "nodejs"]:
            return "javascript"

        c = code or ""

        if re.search(r"#include\s*<", c) or "int main" in c:
            return "c"

        if re.search(r"public\s+class\s+", c) or "System.out" in c:
            return "java"

        if "def " in c or "print(" in c or "import " in c:
            return "python"

        if "console.log" in c or "function " in c or "=> " in c or "const " in c:
            return "javascript"

        return "python"

