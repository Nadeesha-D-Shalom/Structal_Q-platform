import os
import zipfile
from typing import List, Tuple

import fitz  # PyMuPDF


class DiagramExtractor:
    """
    Extracts images for OCR:
    - PDF: renders each page to PNG
    - DOCX: extracts embedded images from word/media
    """

    def __init__(self, artifacts_root: str = "test_files/artifacts/diagrams"):
        self.artifacts_root = artifacts_root
        self.pdf_root = os.path.join(self.artifacts_root, "pdf_pages")
        self.docx_root = os.path.join(self.artifacts_root, "docx_media")
        os.makedirs(self.pdf_root, exist_ok=True)
        os.makedirs(self.docx_root, exist_ok=True)

    def extract_images(self, file_path: str) -> Tuple[str, List[str]]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return "PDF", self._extract_pdf_pages(file_path)
        if ext == ".docx":
            return "DOCX", self._extract_docx_media(file_path)
        raise ValueError("Unsupported file type for diagram extraction. Only PDF and DOCX allowed.")

    def _extract_pdf_pages(self, pdf_path: str) -> List[str]:
        doc = fitz.open(pdf_path)
        out_paths: List[str] = []

        base = os.path.splitext(os.path.basename(pdf_path))[0]
        for i in range(doc.page_count):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=200)  # 200 DPI is a good balance
            out_file = os.path.join(self.pdf_root, f"{base}_page_{i+1}.png")
            pix.save(out_file)
            out_paths.append(out_file)

        doc.close()
        return out_paths

    def _extract_docx_media(self, docx_path: str) -> List[str]:
        out_paths: List[str] = []
        base = os.path.splitext(os.path.basename(docx_path))[0]
        target_dir = os.path.join(self.docx_root, base)
        os.makedirs(target_dir, exist_ok=True)

        with zipfile.ZipFile(docx_path, "r") as z:
            media_files = [n for n in z.namelist() if n.startswith("word/media/")]
            for n in media_files:
                filename = os.path.basename(n)
                out_file = os.path.join(target_dir, filename)
                with z.open(n) as src, open(out_file, "wb") as dst:
                    dst.write(src.read())
                out_paths.append(out_file)

        return out_paths