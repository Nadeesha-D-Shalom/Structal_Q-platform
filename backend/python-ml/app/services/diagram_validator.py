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

    def validate(self, file_path: str, full_text: str, guide_text: str = "") -> Dict[str, Any]:

        has_architecture_section = "System Architecture Diagram" in full_text
        has_usecase_section = "Use Case Diagram" in full_text
        has_er_section = "ER / EER Diagram" in full_text or "ER Diagram" in full_text

        expected_types: List[str] = []
        guide_lower = (guide_text or "").lower()
        if "er / eer diagram" in guide_lower or "er diagram" in guide_lower or "er / eer" in guide_lower:
            expected_types.append("ER")
        if "use case diagram" in guide_lower:
            expected_types.append("UML")
        if "system architecture diagram" in guide_lower or "architecture diagram" in guide_lower:
            expected_types.append("ARCH")

        doc_type, images = self.extractor.extract_images(file_path)
        image_count = len(images)

        # OCR processing
        confidences: List[float] = []
        total_words = 0
        all_ocr_text_parts: List[str] = []

        page_diagram_results: List[Dict[str, Any]] = []

        for idx, img_path in enumerate(images):
            page_no = idx + 1
            o = self.ocr.ocr_image(img_path)

            confidences.append(float(o.get("avg_confidence", 0)))
            total_words += int(o.get("word_count", 0))

            if o.get("text"):
                all_ocr_text_parts.append(o["text"])

            page_ocr_text = (o.get("text") or "")
            page_text_lower = page_ocr_text.lower()
            ocr_conf = float(o.get("avg_confidence", 0))
            word_count = int(o.get("word_count", 0))

            # -------- Clarity Score (per page) --------
            conf_component = min(max(ocr_conf / 100.0, 0.0), 1.0)
            if word_count >= 300:
                text_component = 1.0
            elif word_count >= 150:
                text_component = 0.7
            elif word_count >= 60:
                text_component = 0.4
            else:
                text_component = 0.1

            diagram_clarity_score = round((0.6 * conf_component + 0.4 * text_component), 3)  # 0..1

            # -------- Signal Detection (per page) --------
            er_signals = self._detect_er_signals(page_text_lower)
            usecase_signals = self._detect_usecase_signals(page_text_lower)
            arch_signals = self._detect_arch_signals(page_text_lower)

            max_signal = max(
                er_signals.get("signal_score", 0),
                usecase_signals.get("signal_score", 0),
                arch_signals.get("signal_score", 0),
            )

            # If we detected diagram-ish signals, we treat this page as a diagram page.
            has_diagram = bool(max_signal > 0)

            # -------- Diagram Type Guess --------
            diagram_type_guess = None
            if max_signal > 0:
                if er_signals.get("signal_score", 0) >= usecase_signals.get("signal_score", 0) and \
                   er_signals.get("signal_score", 0) >= arch_signals.get("signal_score", 0):
                    diagram_type_guess = "ER"
                elif usecase_signals.get("signal_score", 0) >= arch_signals.get("signal_score", 0):
                    diagram_type_guess = "UML"
                else:
                    diagram_type_guess = "ARCH"

            # -------- Detected Labels for UI --------
            labels: List[str] = []
            if er_signals.get("pk_detected"): labels.append("PK")
            if er_signals.get("fk_detected"): labels.append("FK")
            if er_signals.get("entity_terms_detected"): labels.append("Entity")
            if er_signals.get("cardinality_detected"): labels.append("Cardinality")
            if er_signals.get("crowfoot_detected"): labels.append("Crow's Foot")

            if usecase_signals.get("actor_detected"): labels.append("Actor")
            if usecase_signals.get("include_detected"): labels.append("Include")
            if usecase_signals.get("extend_detected"): labels.append("Extend")
            if usecase_signals.get("boundary_detected"): labels.append("Boundary")
            if usecase_signals.get("usecase_term_detected"): labels.append("Use Case")

            if arch_signals.get("three_tier_detected"): labels.append("3-Tier")
            if arch_signals.get("frontend_detected"): labels.append("Frontend")
            if arch_signals.get("backend_detected"): labels.append("Backend")
            if arch_signals.get("database_detected"): labels.append("Database")

            if diagram_type_guess:
                labels.append(diagram_type_guess)

            # -------- Issues for UI --------
            issues: List[str] = []
            if has_diagram and diagram_clarity_score < 0.4:
                issues.append("Low diagram clarity")

            if expected_types:
                if not diagram_type_guess:
                    issues.append(
                        f"Diagram type not detected (expected: {', '.join(expected_types)})"
                    )
                elif diagram_type_guess not in expected_types:
                    issues.append(
                        f"Diagram type mismatch (expected: {', '.join(expected_types)})"
                    )

            page_diagram_results.append(
                {
                    "page_no": page_no,
                    "has_diagram": has_diagram,
                    "ocr_text": page_ocr_text,
                    "ocr_confidence": ocr_conf,
                    "clarity_score": round(diagram_clarity_score * 10, 2),  # 0..10 for display
                    "match_score": diagram_clarity_score,  # 0..1 for backend join/clarity
                    "diagram_type": diagram_type_guess,
                    "detected_labels": labels,
                    "expected_labels": expected_types,
                    "issues": issues,
                }
            )

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
            },
            "page_diagram_results": page_diagram_results,
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