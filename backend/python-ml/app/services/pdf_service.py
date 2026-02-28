import os
import pdfplumber
from docx import Document


class DocumentService:

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return self._extract_pdf(file_path)

        elif ext == ".docx":
            return self._extract_docx(file_path)

        else:
            raise ValueError("Unsupported file type. Only PDF and DOCX allowed.")

    def _extract_pdf(self, file_path: str) -> str:
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

    def _extract_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])