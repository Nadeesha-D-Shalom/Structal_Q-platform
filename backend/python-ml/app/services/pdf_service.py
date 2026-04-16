import io
import os
import zipfile

import fitz  # PyMuPDF — most tolerant PDF reader; use before pdfplumber
import pdfplumber
import pytesseract
from docx import Document

import cv2


class DocumentService:

    def extract_text(self, file_path: str) -> str:
        path = self._normalize_path(file_path)
        ext = os.path.splitext(path)[1].lower()

        self._validate_path(path)

        if ext == ".docx":
            return self._extract_docx(path)

        if ext == ".pdf":
            return self._extract_pdf_smart(path)

        raise ValueError("Unsupported file type. Only PDF and DOCX allowed.")

    @staticmethod
    def _normalize_path(file_path: str) -> str:
        if not file_path:
            return file_path
        try:
            return os.path.normpath(os.path.abspath(file_path))
        except Exception:
            return file_path

    @staticmethod
    def _validate_path(file_path: str) -> None:
        if not file_path or not os.path.isfile(file_path):
            raise ValueError(f"File not found or not a file: {file_path}")
        if os.path.getsize(file_path) == 0:
            raise ValueError(f"File is empty (0 bytes): {file_path}")

    @staticmethod
    def _read_all_bytes(file_path: str) -> bytes:
        with open(file_path, "rb") as f:
            return f.read()

    @staticmethod
    def _slice_from_pdf_magic(data: bytes) -> bytes:
        """Some exports prepend BOM or junk before %PDF."""
        idx = data.find(b"%PDF")
        if idx >= 0:
            return data[idx:]
        return data

    @staticmethod
    def _looks_like_pdf(file_path: str) -> bool:
        try:
            with open(file_path, "rb") as f:
                head = f.read(8192)
            return b"%PDF" in head
        except OSError:
            return False

    @staticmethod
    def _is_real_docx_ooxml(file_path: str) -> bool:
        if not zipfile.is_zipfile(file_path):
            return False
        try:
            with zipfile.ZipFile(file_path, "r") as z:
                names = set(z.namelist())
            if "word/document.xml" in names:
                return True
            return any(n.endswith("/word/document.xml") for n in names)
        except Exception:
            return False

    def _open_fitz_document(self, file_path: str):
        """
        Try path, then memory with leading junk stripped (repair common bad exports).
        Returns fitz.Document or raises last error.
        """
        last_err = None
        try:
            return fitz.open(file_path)
        except Exception as e:
            last_err = e
        try:
            data = self._read_all_bytes(file_path)
            data = self._slice_from_pdf_magic(data)
            if not data.startswith(b"%PDF"):
                raise last_err or RuntimeError("not a PDF")
            return fitz.open(stream=data, filetype="pdf")
        except Exception as e:
            if last_err:
                raise last_err from e
            raise

    def _extract_text_fitz(self, doc) -> str:
        parts = []
        try:
            for i in range(doc.page_count):
                parts.append(doc.load_page(i).get_text() or "")
        finally:
            doc.close()
        return "\n".join(parts)

    def _extract_pdf_fitz_path(self, file_path: str) -> str:
        doc = self._open_fitz_document(file_path)
        return self._extract_text_fitz(doc)

    def _extract_pypdf_bytes(self, data: bytes) -> str:
        try:
            from pypdf import PdfReader
        except ImportError:
            raise RuntimeError("pypdf not installed")
        data = self._slice_from_pdf_magic(data)
        reader = PdfReader(io.BytesIO(data))
        out = []
        for page in reader.pages:
            try:
                out.append(page.extract_text() or "")
            except Exception:
                out.append("")
        return "\n".join(out)

    def _extract_pdf_pypdf_path(self, file_path: str) -> str:
        data = self._read_all_bytes(file_path)
        return self._extract_pypdf_bytes(data)

    def _extract_pdf_ocr_fitz(self, file_path: str) -> str:
        """OCR without pdfplumber — works when pdfminer/plumber cannot open the file."""
        try:
            from PIL import Image
        except ImportError:
            raise RuntimeError("Pillow not installed")

        doc = self._open_fitz_document(file_path)
        parts = []
        try:
            max_pages = min(doc.page_count, 40)
            for i in range(max_pages):
                page = doc.load_page(i)
                pix = page.get_pixmap(dpi=180)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                parts.append(pytesseract.image_to_string(img) or "")
        finally:
            doc.close()
        return "\n".join(parts)

    def _extract_pdf_plumber(self, file_path: str) -> str:
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

    def _extract_pdf_plumber_bytes(self, data: bytes) -> str:
        data = self._slice_from_pdf_magic(data)
        text_parts = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

    def _extract_pdf_with_ocr_plumber(self, file_path: str) -> str:
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                try:
                    image = page.to_image(resolution=300).original
                    image = cv2.cvtColor(
                        cv2.imread(image.filename),
                        cv2.COLOR_BGR2GRAY,
                    )
                    text_parts.append(pytesseract.image_to_string(image))
                except Exception:
                    text_parts.append("")
        return "\n".join(text_parts)

    def _extract_pdf_smart(self, file_path: str) -> str:
        """
        Extraction order tuned for broken / mislabeled uploads:
        1) Real DOCX with .pdf name
        2) PyMuPDF (path + repaired stream)
        3) pypdf (optional)
        4) pdfplumber (path + bytes)
        5) OCR via fitz-rendered pages (no pdfplumber)
        6) OCR via pdfplumber if it opens
        7) Blind DOCX
        """
        if self._is_real_docx_ooxml(file_path):
            try:
                return self._extract_docx(file_path)
            except Exception:
                pass

        attempts = [
            ("fitz", lambda: self._extract_pdf_fitz_path(file_path)),
            ("pypdf", lambda: self._extract_pdf_pypdf_path(file_path)),
            ("pdfplumber", lambda: self._extract_pdf_plumber(file_path)),
            (
                "pdfplumber_bytes",
                lambda: self._extract_pdf_plumber_bytes(self._read_all_bytes(file_path)),
            ),
            ("ocr_fitz", lambda: self._extract_pdf_ocr_fitz(file_path)),
            ("ocr_plumber", lambda: self._extract_pdf_with_ocr_plumber(file_path)),
            ("docx_blind", lambda: self._extract_docx(file_path)),
        ]

        last_error = None
        for name, fn in attempts:
            try:
                text = fn()
                if text is not None and len(text.strip()) > 0:
                    return text
            except Exception as e:
                last_error = e
                continue

        raise ValueError(
            "Could not read marking guide / document as PDF or DOCX. "
            "Re-upload a valid PDF or DOCX. If the file is a scan, ensure Tesseract OCR is installed. "
            f"Last error: {last_error!r}. Path: {file_path}"
        ) from last_error

    def _extract_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
