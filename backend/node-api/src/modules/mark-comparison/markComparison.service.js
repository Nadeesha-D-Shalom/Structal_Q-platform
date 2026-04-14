const sql = require("mssql");
const { pool } = require("../../config/db");

// ================= DEVIATION =================
function calculateDeviation(aiScore, lecturerScore, confidenceScore) {
    const ai = Number(aiScore) || 0;
    const lecturer = Number(lecturerScore) || 0;
    const confidence = Number(confidenceScore) || 0;

    const deviation = Math.abs(ai - lecturer);

    const deviationPercentage =
        lecturer === 0 ? 0 : (deviation / lecturer) * 100;

    let riskLevel = "LOW";

    if (deviationPercentage > 20 && confidence < 0.6) {
        riskLevel = "HIGH";
    } else if (deviationPercentage > 10 || confidence < 0.7) {
        riskLevel = "MEDIUM";
    }

    const isAnomaly = deviationPercentage > 30 ? 1 : 0;

    return {
        deviation: Number(deviation.toFixed(2)),
        deviationPercentage: Number(deviationPercentage.toFixed(2)),
        riskLevel,
        isAnomaly
    };
}

// ================= RUBRIC =================
async function calculateRubricScoresDynamic(aiAnalysisResult, marking_guide_id) {
    const result = await pool.request()
        .input("marking_guide_id", sql.BigInt, marking_guide_id)
        .query(`
            SELECT rubric_item_id, criterion_name, max_marks
            FROM guide_rubric_item
            WHERE marking_guide_id = @marking_guide_id
            ORDER BY rubric_item_id ASC
        `);

    const rubricItems = result.recordset;

    if (!rubricItems || rubricItems.length === 0) {
        throw new Error("No rubric items found");
    }

    const scores = [];

    for (const item of rubricItems) {
        const name = (item.criterion_name || "").toLowerCase();
        const maxMarks = Number(item.max_marks) || 0;

        const semantic = Number(aiAnalysisResult.similarity_avg) || 0;
        const structure = Number(aiAnalysisResult.structural_similarity_avg) || 0;

        let score = 0;
        let confidence = 0.75;
        let evidence = "General AI evaluation";

        if (name.includes("structure")) {
            score = structure * maxMarks;
            evidence = "Structure similarity analysis";
            confidence = 0.8;
        } 
        else if (name.includes("content") || name.includes("semantic")) {
            score = semantic * maxMarks;
            evidence = "Semantic similarity evaluation";
            confidence = 0.75;
        } 
        else if (name.includes("diagram")) {
            score = structure * maxMarks; // TEMP FIX
            evidence = "Diagram validation (structure proxy)";
            confidence = 0.7;
        }

        scores.push({
            rubric_item_id: item.rubric_item_id,
            suggested_marks: Number(score.toFixed(2)),
            confidence: Number(confidence.toFixed(4)),
            evidence_excerpt: evidence
        });
    }

    return scores;
}

// ================= MAIN =================
async function compareAndSaveMarks({ submission_id }) {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. ANALYSIS RESULT
        const analysisReq = new sql.Request(transaction);
        const analysisResult = await analysisReq
            .input("submission_id", sql.BigInt, submission_id)
            .query(`
                SELECT TOP 1 *
                FROM analysis_result
                WHERE submission_id = @submission_id
                ORDER BY analysis_result_id DESC
            `);

        if (analysisResult.recordset.length === 0) {
            throw new Error("No AI analysis result found");
        }

        const aiResult = analysisResult.recordset[0];
        const analysis_result_id = aiResult.analysis_result_id;

        if (!aiResult.marking_guide_id) {
            throw new Error("marking_guide_id missing");
        }

        // 2. AI SCORE
        const aiReq = new sql.Request(transaction);
        const aiScoreResult = await aiReq
            .input("analysis_result_id", sql.BigInt, analysis_result_id)
            .query(`
                SELECT ISNULL(SUM(CAST(suggested_marks AS DECIMAL(10,2))), 0) AS ai_score
                FROM ai_question_score
                WHERE analysis_result_id = @analysis_result_id
            `);

        const aiScore = Number(aiScoreResult.recordset[0].ai_score || 0);

        // 3. LECTURER SCORE
        const lecReq = new sql.Request(transaction);
        const lecturerResult = await lecReq
            .input("submission_id", sql.BigInt, submission_id)
            .query(`
                SELECT TOP 1 total_marks_awarded
                FROM final_mark
                WHERE submission_id = @submission_id
                ORDER BY final_mark_id DESC
            `);

        if (lecturerResult.recordset.length === 0) {
            throw new Error("No lecturer mark found");
        }

        const lecturerScore = Number(
            lecturerResult.recordset[0].total_marks_awarded || 0
        );

        // 4. CONFIDENCE
        const confReq = new sql.Request(transaction);
        const confidenceResult = await confReq
            .input("analysis_result_id", sql.BigInt, analysis_result_id)
            .query(`
                SELECT ISNULL(AVG(CAST(confidence AS DECIMAL(10,2))), 0) AS confidence_score
                FROM ai_question_score
                WHERE analysis_result_id = @analysis_result_id
            `);

        const confidenceScore = Number(
            confidenceResult.recordset[0].confidence_score || 0
        );

        // 5. DEVIATION
        const { deviation, deviationPercentage, riskLevel, isAnomaly } =
            calculateDeviation(aiScore, lecturerScore, confidenceScore);

        // 6. SAVE COMPARISON
        const saveReq = new sql.Request(transaction);
        const saveResult = await saveReq
            .input("submission_id", sql.BigInt, submission_id)
            .input("ai_score", sql.Decimal(10, 2), aiScore)
            .input("lecturer_score", sql.Decimal(10, 2), lecturerScore)
            .input("deviation", sql.Decimal(10, 2), deviation)
            .input("deviation_percentage", sql.Decimal(10, 2), deviationPercentage)
            .input("risk_level", sql.NVarChar(20), riskLevel)
            .input("is_anomaly", sql.Bit, isAnomaly)
            .query(`
                INSERT INTO mark_comparison (
                    submission_id,
                    ai_score,
                    lecturer_score,
                    deviation,
                    deviation_percentage,
                    risk_level,
                    is_anomaly,
                    created_at
                )
                OUTPUT INSERTED.comparison_id
                VALUES (
                    @submission_id,
                    @ai_score,
                    @lecturer_score,
                    @deviation,
                    @deviation_percentage,
                    @risk_level,
                    @is_anomaly,
                    GETDATE()
                )
            `);

        // 7. RUBRIC
        const rubricScores = await calculateRubricScoresDynamic(
            aiResult,
            aiResult.marking_guide_id
        );

        for (const r of rubricScores) {
            const rReq = new sql.Request(transaction);

            await rReq
                .input("analysis_result_id", sql.BigInt, analysis_result_id)
                .input("rubric_item_id", sql.BigInt, r.rubric_item_id)
                .input("suggested_marks", sql.Decimal(10, 2), r.suggested_marks)
                .input("confidence", sql.Decimal(10, 4), r.confidence)
                .input("evidence_excerpt", sql.NVarChar(sql.MAX), r.evidence_excerpt)
                .query(`
                    INSERT INTO ai_rubric_score (
                        analysis_result_id,
                        rubric_item_id,
                        suggested_marks,
                        confidence,
                        evidence_excerpt,
                        created_at
                    )
                    VALUES (
                        @analysis_result_id,
                        @rubric_item_id,
                        @suggested_marks,
                        @confidence,
                        @evidence_excerpt,
                        GETDATE()
                    )
                `);
        }

        await transaction.commit();

        return {
            comparison_id: saveResult.recordset[0].comparison_id,
            submission_id,
            analysis_result_id,
            ai_score: aiScore,
            lecturer_score: lecturerScore,
            deviation,
            deviation_percentage: deviationPercentage,
            risk_level: riskLevel,
            is_anomaly: Boolean(isAnomaly),
            confidence_score: confidenceScore
        };

    } catch (error) {
        await transaction.rollback();
        console.error("MARK COMPARISON ERROR:", error);
        throw error;
    }
}

module.exports = {
    compareAndSaveMarks
};