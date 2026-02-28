import re
from typing import Dict, Any, Tuple, List

import cv2
import numpy as np
import pytesseract
from PIL import Image


class OCRService:
    """
    OCR with preprocessing + simple confidence estimation.
    """

    def __init__(self, tesseract_cmd: str = ""):
        # If tesseract is in PATH, keep empty. If not, set full path.
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def ocr_image(self, image_path: str) -> Dict[str, Any]:
        img = cv2.imread(image_path)
        if img is None:
            return {
                "text": "",
                "avg_confidence": 0.0,
                "word_count": 0,
            }

        processed = self._preprocess(img)

        data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
        words: List[str] = []
        confs: List[float] = []

        n = len(data.get("text", []))
        for i in range(n):
            w = (data["text"][i] or "").strip()
            conf = float(data["conf"][i]) if str(data["conf"][i]).isdigit() else -1.0
            if w:
                words.append(w)
            if conf >= 0:
                confs.append(conf)

        text = " ".join(words)
        avg_conf = float(sum(confs) / len(confs)) if confs else 0.0
        return {
            "text": text,
            "avg_confidence": round(avg_conf, 2),
            "word_count": len(words),
        }

    def _preprocess(self, img: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Upscale for small text
        h, w = gray.shape[:2]
        if w < 1200:
            scale = 2.0
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        # Denoise
        gray = cv2.bilateralFilter(gray, 9, 75, 75)

        # Adaptive threshold
        thr = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31, 2
        )
        return thr