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
    - diagram_score (final ML-ready score)
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

        # OCR processing
        confidences: List[float] = []
        total_words = 0
        all_ocr_text_parts: List[str] = []

        for img_path in images:
            o = self.ocr.ocr_image(img_path)

            confidences.append(float(o.get("avg_confidence", 0)))
            total_words += int(o.get("word_count", 0))

            if o.get("text"):
                all_ocr_text_parts.append(o["text"])

        all_ocr_text = " ".join(all_ocr_text_parts).lower()
        ocr_avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0

        # -------- Clarity Score --------
        conf_component = min(max(ocr_avg_conf / 100.0, 0.0), 1.0)

        if total_words >= 300:
            text_component = 1.0
        elif total_words >= 150:
            text_component = 0.7
        elif total_words >= 60:
            text_component = 0.4
        else:
            text_component = 0.1

        diagram_clarity_score = round((0.6 * conf_component + 0.4 * text_component), 3)

        # -------- Signal Detection --------
        er_signals = self._detect_er_signals(all_ocr_text)
        usecase_signals = self._detect_usecase_signals(all_ocr_text)
        arch_signals = self._detect_arch_signals(all_ocr_text)

        # -------- Final Diagram Score (IMPORTANT) --------
        diagram_score = self._compute_final_diagram_score(
            diagram_clarity_score,
            er_signals,
            usecase_signals,
            arch_signals
        )

        return {
            "doc_type": doc_type,
            "has_architecture_section": has_architecture_section,
            "has_usecase_section": has_usecase_section,
            "has_er_section": has_er_section,
            "image_count": image_count,
            "ocr_avg_confidence": ocr_avg_conf,
            "ocr_word_count": total_words,
            "diagram_clarity_score": diagram_clarity_score,
            "diagram_score": diagram_score,  # 🔥 ML uses this
            "detected_signals": {
                "er": er_signals,
                "usecase": usecase_signals,
                "architecture": arch_signals
            }
        }

    # ---------------- ER Detection ----------------
    def _detect_er_signals(self, text: str) -> Dict[str, Any]:
        pk = bool(re.search(r"\bpk\b|primary\s*key", text))
        fk = bool(re.search(r"\bfk\b|foreign\s*key", text))
        entity = bool(re.search(r"\bentity\b|\btable\b", text))
        cardinality = bool(re.search(r"1\.\.1|1\.\.n|0\.\.1|0\.\.n|one\s*to\s*many|many\s*to\s*many", text))
        crow_foot = bool(re.search(r"crow'?s?\s*foot", text))

        score = sum([pk, fk, entity, cardinality, crow_foot])

        return {
            "pk_detected": pk,
            "fk_detected": fk,
            "entity_terms_detected": entity,
            "cardinality_detected": cardinality,
            "crowfoot_detected": crow_foot,
            "signal_score": score
        }

    # ---------------- Use Case Detection ----------------
    def _detect_usecase_signals(self, text: str) -> Dict[str, Any]:
        actor = bool(re.search(r"\bactor\b", text))
        include = bool(re.search(r"<<\s*include\s*>>|include", text))
        extend = bool(re.search(r"<<\s*extend\s*>>|extend", text))
        boundary = bool(re.search(r"system\s*boundary|boundary", text))
        usecase = bool(re.search(r"\buse\s*case\b|\busecase\b", text))

        score = sum([actor, include, extend, boundary, usecase])

        return {
            "actor_detected": actor,
            "include_detected": include,
            "extend_detected": extend,
            "boundary_detected": boundary,
            "usecase_term_detected": usecase,
            "signal_score": score
        }

    # ---------------- Architecture Detection ----------------
    def _detect_arch_signals(self, text: str) -> Dict[str, Any]:
        three_tier = bool(re.search(r"3[-\s]*tier|three[-\s]*tier", text))
        frontend = "frontend" in text or "client" in text
        backend = "backend" in text or "api" in text or "server" in text
        database = "database" in text or "db" in text or "mysql" in text or "sql" in text

        score = sum([three_tier, frontend, backend, database])

        return {
            "three_tier_detected": three_tier,
            "frontend_detected": frontend,
            "backend_detected": backend,
            "database_detected": database,
            "signal_score": score
        }

    # ---------------- Final Score ----------------
    def _compute_final_diagram_score(
        self,
        clarity_score: float,
        er_signals: Dict[str, Any],
        usecase_signals: Dict[str, Any],
        arch_signals: Dict[str, Any]
    ) -> float:

        max_signal = max(
            er_signals.get("signal_score", 0),
            usecase_signals.get("signal_score", 0),
            arch_signals.get("signal_score", 0)
        )

        signal_component = min(max_signal / 5.0, 1.0)

        final_score = (0.6 * clarity_score) + (0.4 * signal_component)

        return round(final_score, 3)