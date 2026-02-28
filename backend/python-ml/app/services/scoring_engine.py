class ScoringEngine:
    """
    Fully Dynamic Section-Based Scoring Engine
    """

    def evaluate(self, parsed, diagram: dict, guide):

        results = {}
        total_score = 0

        # ---------------------------------------
        # Mandatory Diagram Auto-Fail
        # ---------------------------------------
        if not diagram.get("has_er_section") or not diagram.get("has_usecase_section"):
            return {
                "error": "Mandatory diagrams missing (ER or Use Case)",
                "final_score": 0
            }

        # ---------------------------------------
        # Loop through guide sections dynamically
        # ---------------------------------------
        for section_code, section_data in guide.sections.items():

            max_marks = section_data["marks"]
            section_title = section_data["title"].lower()

            score = self._score_by_section(
                section_code,
                section_title,
                parsed,
                diagram,
                max_marks
            )

            results[f"section_{section_code}"] = score
            total_score += score

        # ---------------------------------------
        # Diagram Clarity Global Penalty
        # ---------------------------------------
        clarity = float(diagram.get("diagram_clarity_score", 0))
        penalty_factor = 1.0

        if clarity < 0.30:
            penalty_factor = 0.7
        elif clarity < 0.50:
            penalty_factor = 0.6
        elif clarity < 0.70:
            penalty_factor = 0.85

        total_score = int(round(total_score * penalty_factor))

        # ---------------------------------------
        # Boilerplate Penalty
        # ---------------------------------------
        if parsed.unique_word_ratio < 0.35:
            total_score = int(total_score * 0.8)

        results["diagram_clarity"] = clarity
        results["penalty_factor"] = penalty_factor
        results["unique_word_ratio"] = parsed.unique_word_ratio
        results["final_score"] = total_score

        return results

    # ------------------------------------------------------
    # Dynamic Section Detection Based on Title Keywords
    # ------------------------------------------------------
    def _score_by_section(self, code, title, parsed, diagram, max_marks):

        if max_marks == 0:
            return 0

        if "requirement" in title:
            return self._score_requirements(parsed, max_marks)

        elif "design" in title:
            return self._score_design(parsed, diagram, max_marks)

        elif "implement" in title or "crud" in title:
            return self._score_implementation(parsed, max_marks)

        elif "database" in title:
            return self._score_database(parsed, diagram, max_marks)

        elif "testing" in title or "validation" in title:
            return self._score_testing(parsed, max_marks)

        elif "individual" in title or "contribution" in title:
            return self._score_individual(parsed, max_marks)

        # Unknown section
        return 0

    # ------------------------------------------------------
    # REQUIREMENTS
    # ------------------------------------------------------
    def _score_requirements(self, parsed, max_marks):

        fr_ratio = min(parsed.fr_count / 20, 1)
        nfr_ratio = min(parsed.nfr_count / 10, 1)

        return int(round((0.7 * fr_ratio + 0.3 * nfr_ratio) * max_marks))

    # ------------------------------------------------------
    # DESIGN
    # ------------------------------------------------------
    def _score_design(self, parsed, diagram, max_marks):

        clarity = float(diagram.get("diagram_clarity_score", 0))
        er_sig = diagram.get("detected_signals", {}).get("er", {}).get("signal_score", 0)
        uc_sig = diagram.get("detected_signals", {}).get("usecase", {}).get("signal_score", 0)
        arch_sig = diagram.get("detected_signals", {}).get("architecture", {}).get("signal_score", 0)

        signal_component = min((er_sig + uc_sig + arch_sig) / 15, 1)
        design_ratio = min((0.6 * clarity + 0.4 * signal_component), 1)

        return int(round(design_ratio * max_marks))

    # ------------------------------------------------------
    # IMPLEMENTATION
    # ------------------------------------------------------
    def _score_implementation(self, parsed, max_marks):

        ui_ratio = min(parsed.ui_count / 24, 1)
        actor_ratio = min(parsed.actor_count / 6, 1)

        return int(round((0.6 * ui_ratio + 0.4 * actor_ratio) * max_marks))

    # ------------------------------------------------------
    # DATABASE
    # ------------------------------------------------------
    def _score_database(self, parsed, diagram, max_marks):

        entity_ratio = min(parsed.entity_count / 12, 1)

        er_signals = diagram.get("detected_signals", {}).get("er", {})
        pk_detected = er_signals.get("pk_detected", False)
        fk_detected = er_signals.get("fk_detected", False)

        constraint_ratio = 1 if (pk_detected and fk_detected) else 0.5

        return int(round((0.6 * entity_ratio + 0.4 * constraint_ratio) * max_marks))

    # ------------------------------------------------------
    # TESTING (STRICT)
    # ------------------------------------------------------
    def _score_testing(self, parsed, max_marks):

        if not parsed.has_testing_section:
            return 0

        if not parsed.has_test_table:
            return 0

        score_ratio = 0

        if parsed.test_case_count >= 5:
            score_ratio += 0.6
        elif parsed.test_case_count >= 3:
            score_ratio += 0.4
        else:
            score_ratio += 0.2

        if parsed.has_validation_section:
            score_ratio += 0.4

        return int(round(score_ratio * max_marks))

    # ------------------------------------------------------
    # INDIVIDUAL CONTRIBUTION
    # ------------------------------------------------------
    def _score_individual(self, parsed, max_marks):

        if not parsed.has_individual_section:
            return 0

        score_ratio = 0

        if parsed.member_name_count >= 6:
            score_ratio += 0.5

        if parsed.individual_word_count >= 150:
            score_ratio += 0.5
        elif parsed.individual_word_count >= 80:
            score_ratio += 0.3

        return int(round(score_ratio * max_marks))