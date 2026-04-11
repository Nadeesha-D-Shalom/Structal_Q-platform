const axios = require("axios");
const sql = require("mssql");
const { pool } = require("../../config/db");

const AI_BASE_URL = "http://localhost:8000";


// ================= AI CALL =================
async function runAIAnalysis(payload) {
    try {
        const response = await axios.post(`${AI_BASE_URL}/evaluate`, {
            student_file: payload.submission_path,
            guide_file: payload.guide_file
        });

        return response.data;

    } catch (error) {
        console.error("AI Service Error:", error.message);

        if (error.response) {
            console.error("AI Response:", error.response.data);
        }

        throw new Error("AI service call failed");
    }
}


// ================= SAVE QUESTION SCORES =================
async function saveAiQuestionScores(analysis_result_id, questionScores = []) {
    if (!questionScores || questionScores.length === 0) {
        console.log("No question-level data from AI");
        return;
    }

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const item of questionScores) {
            const request = new sql.Request(transaction);

            await request
                .input("analysis_result_id", sql.BigInt, analysis_result_id)
                .input("question_id", sql.BigInt, item.question_id)
                .input(
                    "keyword_matches",
                    sql.NVarChar(sql.MAX),
                    item.keyword_matches ? JSON.stringify(item.keyword_matches) : null
                )
                .input(
                    "keyword_score",
                    sql.Decimal(10, 4),
                    item.keyword_score ?? null
                )
                .input(
                    "semantic_score",
                    sql.Decimal(10, 4),
                    item.semantic_score ?? null
                )
                .input(
                    "suggested_marks",
                    sql.Decimal(10, 2),
                    item.suggested_marks ?? null
                )
                .input(
                    "confidence",
                    sql.Decimal(10, 4),
                    item.confidence ?? null
                )
                .input(
                    "missing_keywords",
                    sql.NVarChar(sql.MAX),
                    item.missing_keywords ? JSON.stringify(item.missing_keywords) : null
                )
                .query(`
                    INSERT INTO dbo.ai_question_score (
                        analysis_result_id,
                        question_id,
                        keyword_matches,
                        keyword_score,
                        semantic_score,
                        suggested_marks,
                        confidence,
                        missing_keywords,
                        created_at
                    )
                    VALUES (
                        @analysis_result_id,
                        @question_id,
                        @keyword_matches,
                        @keyword_score,
                        @semantic_score,
                        @suggested_marks,
                        @confidence,
                        @missing_keywords,
                        GETDATE()
                    )
                `);
        }

        await transaction.commit();

    } catch (error) {
        await transaction.rollback();
        console.error("AI QUESTION SCORE INSERT ERROR:", error);
        throw error;
    }
}


// ================= DB SAVE =================
async function saveAnalysisToDB({
    submission_id,
    marking_guide_id,
    aiResult
}) {
    try {
        if (!aiResult) {
            throw new Error("AI result is undefined");
        }

        const request = pool.request();

        // ===== SAFE FIELD EXTRACTION =====
        const similarity_avg =
            aiResult.semantic_similarity ||
            aiResult.similarity_score ||
            0;

        const structural_similarity_avg =
            aiResult?.diagram_analysis?.diagram_score ||
            aiResult.structural_similarity ||
            0;

        const finalScore =
            aiResult.final_score ||
            aiResult.score ||
            0;

        const missingSections = [];

        if (aiResult.section_E === 0) missingSections.push("TESTING");
        if (aiResult.section_F === 0) missingSections.push("INDIVIDUAL");

        const riskScore = 1 - similarity_avg;

        let riskLevel = "LOW";
        if (finalScore < 40) riskLevel = "HIGH";
        else if (finalScore < 70) riskLevel = "MEDIUM";

        const ocrUsed =
            aiResult?.diagram_analysis?.ocr_word_count > 0 ? 1 : 0;

        const cvUsed =
            aiResult?.diagram_analysis?.image_count > 0 ? 1 : 0;

        // ===== INSERT WITH RETURN ID =====
        const result = await request
            .input("submission_id", sql.BigInt, submission_id)
            .input("marking_guide_id", sql.BigInt, marking_guide_id)
            .input("analysis_type", sql.NVarChar, "FULL_AI_ANALYSIS")
            .input("similarity_max", sql.Decimal(10, 4), similarity_avg)
            .input("similarity_avg", sql.Decimal(10, 4), similarity_avg)
            .input("structural_similarity_avg", sql.Decimal(10, 4), structural_similarity_avg)
            .input("missing_sections", sql.NVarChar, JSON.stringify(missingSections))
            .input("risk_score", sql.Decimal(10, 4), riskScore)
            .input("risk_level", sql.NVarChar, riskLevel)
            .input("ocr_used", sql.Bit, ocrUsed)
            .input("cv_used", sql.Bit, cvUsed)
            .input("started_at", sql.DateTime, new Date())
            .input("completed_at", sql.DateTime, new Date())
            .input("status", sql.NVarChar, "COMPLETED")
            .query(`
                INSERT INTO analysis_result (
                    submission_id,
                    marking_guide_id,
                    analysis_type,
                    similarity_max,
                    similarity_avg,
                    structural_similarity_avg,
                    missing_sections,
                    risk_score,
                    risk_level,
                    ocr_used,
                    cv_used,
                    started_at,
                    completed_at,
                    status
                )
                OUTPUT INSERTED.analysis_result_id
                VALUES (
                    @submission_id,
                    @marking_guide_id,
                    @analysis_type,
                    @similarity_max,
                    @similarity_avg,
                    @structural_similarity_avg,
                    @missing_sections,
                    @risk_score,
                    @risk_level,
                    @ocr_used,
                    @cv_used,
                    @started_at,
                    @completed_at,
                    @status
                )
            `);

        const analysis_result_id = result.recordset[0].analysis_result_id;

        // ===== STEP 2: INSERT QUESTION SCORES =====
        // Expected AI format:
        // aiResult.question_scores = [ {...}, {...} ]

        if (aiResult.question_scores) {
            await saveAiQuestionScores(
                analysis_result_id,
                aiResult.question_scores
            );
        }

        return {
            success: true,
            analysis_result_id
        };

    } catch (error) {
        console.error("DB INSERT ERROR:", error);
        throw error;
    }
}


module.exports = {
    runAIAnalysis,
    saveAnalysisToDB
};