import os
import pdfplumber
from docx import Document

import pytesseract
import cv2


class DocumentService:

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            text = self._extract_pdf(file_path)

            # OCR fallback if empty or very low content
            if not text or len(text.strip()) < 50:
                return self._extract_pdf_with_ocr(file_path)

            return text

        elif ext == ".docx":
            return self._extract_docx(file_path)

        else:
            raise ValueError("Unsupported file type. Only PDF and DOCX allowed.")

    # ---------- PDF TEXT ----------
    def _extract_pdf(self, file_path: str) -> str:
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

    # ---------- OCR FALLBACK ----------
    def _extract_pdf_with_ocr(self, file_path: str) -> str:
        text_parts = []

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                try:
                    # Convert PDF page to image
                    image = page.to_image(resolution=300).original

                    # Convert to OpenCV format
                    image = cv2.cvtColor(
                        cv2.imread(image.filename),
                        cv2.COLOR_BGR2GRAY
                    )

                    # OCR
                    text = pytesseract.image_to_string(image)

                    text_parts.append(text)

                except Exception:
                    text_parts.append("")

        return "\n".join(text_parts)

    # ---------- DOCX ----------
    def _extract_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])