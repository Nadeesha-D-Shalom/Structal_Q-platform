import re
from typing import Dict, Any, List

from app.services.diagram_extractor import DiagramExtractor
from app.services.ocr_service import OCRService


class DiagramValidator:
    """
    Full OCR-based diagram validation.

    Outputs:
    - image_count
    - ocr_avg_confidence
    - diagram_clarity_score (0..1)
    - detected_signals (ER/USECASE/ARCH)
    """

    def __init__(self):
        self.extractor = DiagramExtractor()
        self.ocr = OCRService()

    def validate(self, file_path: str, full_text: str) -> Dict[str, Any]:

        has_architecture_section = "System Architecture Diagram" in full_text
        has_usecase_section = "Use Case Diagram" in full_text
        has_er_section = "ER / EER Diagram" in full_text or "ER Diagram" in full_text

        doc_type, images = self.extractor.extract_images(file_path)
        image_count = len(images)

        # OCR all extracted images/pages
        confidences: List[float] = []
        total_words = 0
        all_ocr_text_parts: List[str] = []

        for img_path in images:
            o = self.ocr.ocr_image(img_path)
            confidences.append(float(o["avg_confidence"]))
            total_words += int(o["word_count"])
            if o["text"]:
                all_ocr_text_parts.append(o["text"])

        all_ocr_text = " ".join(all_ocr_text_parts).lower()
        ocr_avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0

        # Clarity score:
        # - confidence contributes (0..100 -> 0..1)
        # - enough text extracted contributes
        conf_component = min(max(ocr_avg_conf / 100.0, 0.0), 1.0)
        text_component = 0.0
        if total_words >= 300:
            text_component = 1.0
        elif total_words >= 150:
            text_component = 0.7
        elif total_words >= 60:
            text_component = 0.4
        else:
            text_component = 0.1

        diagram_clarity_score = round((0.6 * conf_component + 0.4 * text_component), 3)

        # Detect content signals in OCR text (diagram content)
        er_signals = self._detect_er_signals(all_ocr_text)
        usecase_signals = self._detect_usecase_signals(all_ocr_text)
        arch_signals = self._detect_arch_signals(all_ocr_text)

        return {
            "doc_type": doc_type,
            "has_architecture_section": has_architecture_section,
            "has_usecase_section": has_usecase_section,
            "has_er_section": has_er_section,
            "image_count": image_count,
            "ocr_avg_confidence": ocr_avg_conf,
            "ocr_word_count": total_words,
            "diagram_clarity_score": diagram_clarity_score,
            "detected_signals": {
                "er": er_signals,
                "usecase": usecase_signals,
                "architecture": arch_signals
            }
        }

    def _detect_er_signals(self, text: str) -> Dict[str, Any]:
        # Look for PK/FK and common ER words
        pk = bool(re.search(r"\bpk\b|primary\s*key", text))
        fk = bool(re.search(r"\bfk\b|foreign\s*key", text))
        entity = bool(re.search(r"\bentity\b|\btable\b", text))
        cardinality = bool(re.search(r"1\.\.1|1\.\.n|0\.\.1|0\.\.n|one\s*to\s*many|many\s*to\s*many", text))
        crow_foot = bool(re.search(r"crow'?s?\s*foot", text))

        score = 0
        score += 1 if pk else 0
        score += 1 if fk else 0
        score += 1 if entity else 0
        score += 1 if cardinality else 0
        score += 1 if crow_foot else 0

        return {
            "pk_detected": pk,
            "fk_detected": fk,
            "entity_terms_detected": entity,
            "cardinality_detected": cardinality,
            "crowfoot_detected": crow_foot,
            "signal_score": score
        }

    def _detect_usecase_signals(self, text: str) -> Dict[str, Any]:
        actor = bool(re.search(r"\bactor\b", text))
        include = bool(re.search(r"<<\s*include\s*>>|include", text))
        extend = bool(re.search(r"<<\s*extend\s*>>|extend", text))
        system_boundary = bool(re.search(r"system\s*boundary|boundary", text))
        usecase_word = bool(re.search(r"\buse\s*case\b|\busecase\b", text))

        score = 0
        score += 1 if actor else 0
        score += 1 if include else 0
        score += 1 if extend else 0
        score += 1 if system_boundary else 0
        score += 1 if usecase_word else 0

        return {
            "actor_detected": actor,
            "include_detected": include,
            "extend_detected": extend,
            "boundary_detected": system_boundary,
            "usecase_term_detected": usecase_word,
            "signal_score": score
        }

    def _detect_arch_signals(self, text: str) -> Dict[str, Any]:
        three_tier = bool(re.search(r"3[-\s]*tier|three[-\s]*tier", text))
        frontend = "frontend" in text or "client" in text
        backend = "backend" in text or "api" in text or "server" in text
        database = "database" in text or "db" in text or "mysql" in text or "sql" in text

        score = 0
        score += 1 if three_tier else 0
        score += 1 if frontend else 0
        score += 1 if backend else 0
        score += 1 if database else 0

        return {
            "three_tier_detected": three_tier,
            "frontend_detected": frontend,
            "backend_detected": backend,
            "database_detected": database,
            "signal_score": score
        }
