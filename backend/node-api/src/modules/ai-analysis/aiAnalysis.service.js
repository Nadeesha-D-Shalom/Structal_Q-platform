const axios = require("axios");
const sql = require("mssql");
const { ML_SERVICE_URL } = require("../../config/env");
const AI_BASE_URL = ML_SERVICE_URL;
const { pool, poolConnect } = require("../../config/db");

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


// ================= MAP SECTIONS (FIXED) =================
async function mapSectionsToQuestions(aiResult, marking_guide_id) {
    const result = await pool.request()
        .input("guide_id", sql.BigInt, marking_guide_id)
        .query(`
            SELECT question_id, question_no
            FROM guide_question
            WHERE marking_guide_id = @guide_id
            ORDER BY question_no ASC
        `);

    const questions = result.recordset;

    const sectionKeys = [
        "section_A",
        "section_B",
        "section_C",
        "section_D",
        "section_E",
        "section_F"
    ];

    const mapped = questions.map((q, index) => {
        const sectionKey = sectionKeys[index];
        const marks = aiResult[sectionKey] || 0;

        return {
            question_id: q.question_id, // REAL FK ID
            keyword_matches: [],
            keyword_score: marks / 100,
            semantic_score: aiResult.semantic_similarity || 0,
            suggested_marks: marks,
            confidence:
                aiResult.confidence_score ||
                aiResult.semantic_similarity ||
                0.75,
            missing_keywords: []
        };
    });

    console.log("Mapped Question Scores (REAL IDs):", mapped);

    return mapped;
}


// ================= SAVE QUESTION SCORES =================
async function saveAiQuestionScores(analysis_result_id, questionScores = []) {
    if (!questionScores || questionScores.length === 0) {
        console.log("No question-level data from AI");
        return;
    }

    console.log("Saving AI Question Scores...");

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const item of questionScores) {
            const request = new sql.Request(transaction);

            await request
                .input("analysis_result_id", sql.BigInt, analysis_result_id)
                .input("question_id", sql.BigInt, item.question_id)
                .input("keyword_matches", sql.NVarChar(sql.MAX), JSON.stringify(item.keyword_matches))
                .input("keyword_score", sql.Decimal(10, 4), item.keyword_score)
                .input("semantic_score", sql.Decimal(10, 4), item.semantic_score)
                .input("suggested_marks", sql.Decimal(10, 2), item.suggested_marks)
                .input("confidence", sql.Decimal(10, 4), item.confidence)
                .input("missing_keywords", sql.NVarChar(sql.MAX), JSON.stringify(item.missing_keywords))
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

        console.log("AI QUESTION SCORES INSERTED SUCCESSFULLY");

    } catch (error) {
        await transaction.rollback();
        console.error("AI QUESTION SCORE INSERT ERROR:", error);
        throw error;
    }
}


// ================= SAVE DIAGRAM EVIDENCE (PER PAGE) =================
async function saveDiagramPageResultsToDB(analysis_result_id, diagramAnalysis) {
    const pages = diagramAnalysis?.page_diagram_results || [];
    if (!Array.isArray(pages) || pages.length === 0) return;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const page of pages) {
            if (!page || !page.has_diagram) continue;

            // OCR evidence row
            await new sql.Request(transaction)
                .input("analysis_result_id", sql.BigInt, analysis_result_id)
                .input("page_no", sql.Int, Number(page.page_no))
                .input("ocr_text", sql.NVarChar(sql.MAX), page.ocr_text || null)
                .input("ocr_confidence", sql.Decimal(10, 4), Number(page.ocr_confidence || 0))
                .input("has_diagram", sql.Bit, page.has_diagram ? 1 : 0)
                .query(`
                    INSERT INTO dbo.ocr_page_result (
                        analysis_result_id,
                        page_no,
                        ocr_text,
                        ocr_confidence,
                        has_diagram,
                        created_at
                    )
                    VALUES (
                        @analysis_result_id,
                        @page_no,
                        @ocr_text,
                        @ocr_confidence,
                        @has_diagram,
                        GETDATE()
                    );
                `);

            // Diagram validation/check row
            await new sql.Request(transaction)
                .input("analysis_result_id", sql.BigInt, analysis_result_id)
                .input("diagram_type", sql.NVarChar(50), page.diagram_type || null)
                .input("page_no", sql.Int, Number(page.page_no))
                .input("detected_labels", sql.NVarChar(sql.MAX), JSON.stringify(page.detected_labels || []))
                .input("expected_labels", sql.NVarChar(sql.MAX), JSON.stringify(page.expected_labels || []))
                .input("match_score", sql.Decimal(10, 4), Number(page.match_score || 0))
                .input("issues", sql.NVarChar(sql.MAX), JSON.stringify(page.issues || []))
                .query(`
                    INSERT INTO dbo.diagram_check_result (
                        analysis_result_id,
                        diagram_type,
                        page_no,
                        detected_labels,
                        expected_labels,
                        match_score,
                        issues,
                        created_at
                    )
                    VALUES (
                        @analysis_result_id,
                        @diagram_type,
                        @page_no,
                        @detected_labels,
                        @expected_labels,
                        @match_score,
                        @issues,
                        GETDATE()
                    );
                `);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("DIAGRAM EVIDENCE INSERT ERROR:", error);
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

        const similarity_avg = aiResult.semantic_similarity || 0;
        const structural_similarity_avg =
            aiResult.structural_similarity ||
            aiResult?.diagram_analysis?.diagram_score ||
            0;

        const finalScore = aiResult.final_score || 0;

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

        // ===== INSERT MAIN =====
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

        console.log("Generated analysis_result_id:", analysis_result_id);

        // ===== FIXED STEP =====
        // Persist per-page diagram OCR evidence so lecturer UI can render diagram evidence cards.
        await saveDiagramPageResultsToDB(
            analysis_result_id,
            aiResult?.diagram_analysis
        );

        const questionScores = await mapSectionsToQuestions(
            aiResult,
            marking_guide_id
        );

        await saveAiQuestionScores(analysis_result_id, questionScores);

        return {
            success: true,
            analysis_result_id
        };

    } catch (error) {
        console.error("DB INSERT ERROR:", error);
        throw error;
    }
}


// ================= GET SUBMISSIONS BY ASSESSMENT =================
exports.getSubmissionsByAssessment = async (assessmentId) => {
    const result = await pool.request()
        .input("assessmentId", sql.Int, assessmentId)
        .query(`
            SELECT 
                s.submission_id,
                s.marking_guide_id, -- IMPORTANT FIX
                fs.storage_path,
                mg.file_id AS guide_path
            FROM submission s
            JOIN file_storage fs ON s.file_id = fs.file_id
            JOIN marking_guide mg ON s.assessment_id = mg.assessment_id
            WHERE s.assessment_id = @assessmentId
              AND fs.is_deleted = 0
        `);

    return result.recordset;
};


// ================= GET ANALYSIS RESULTS =================
async function getAnalysisResults(submissionId) {
    try {
        const request = pool.request();

        const result = await request
            .input("submission_id", sql.BigInt, submissionId)
            .query(`
                SELECT 
                    ar.*,
                    (SELECT * FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id FOR JSON PATH) as question_scores
                FROM analysis_result ar
                WHERE ar.submission_id = @submission_id
                ORDER BY ar.analysis_result_id DESC
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        const record = result.recordset[0];

        // Parse question scores if they exist
        if (record.question_scores) {
            try {
                record.question_scores = JSON.parse(record.question_scores);
            } catch (e) {
                record.question_scores = [];
            }
        }

        return record;
    } catch (error) {
        console.error("Get Analysis Results Error:", error);
        throw error;
    }
}

async function getAnalysisResultById(analysisResultId) {
    try {
        const request = pool.request();

        const result = await request
            .input("analysis_result_id", sql.BigInt, analysisResultId)
            .query(`
                SELECT 
                    ar.*,
                    (SELECT * FROM ai_question_score WHERE analysis_result_id = ar.analysis_result_id FOR JSON PATH) as question_scores
                FROM analysis_result ar
                WHERE ar.analysis_result_id = @analysis_result_id
                ORDER BY ar.analysis_result_id DESC
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        const record = result.recordset[0];

        if (record.question_scores) {
            try {
                record.question_scores = JSON.parse(record.question_scores);
            } catch (e) {
                record.question_scores = [];
            }
        }

        return record;
    } catch (error) {
        console.error("Get Analysis Result By ID Error:", error);
        throw error;
    }
}

const getAllEvaluatedResults = async () => {
    await poolConnect;

    const request = pool.request();

    const result = await request.query(`
        SELECT 
    ar.analysis_result_id,
    ar.submission_id,

    CAST(ar.similarity_avg * 100 AS DECIMAL(10,2)) AS final_score,

    ISNULL(ar.risk_level, 'LOW') AS risk_level,

    fs.file_id AS student_file_id,
    fg.file_id AS guide_file_id,

    a.assessment_title AS assessment_name

FROM analysis_result ar

INNER JOIN (
    -- GET LATEST RESULT PER SUBMISSION
    SELECT submission_id, MAX(analysis_result_id) AS latest_id
    FROM analysis_result
    WHERE status = 'COMPLETED'
    GROUP BY submission_id
) latest
    ON ar.analysis_result_id = latest.latest_id

INNER JOIN submission s 
    ON ar.submission_id = s.submission_id

INNER JOIN file_storage fs 
    ON s.file_id = fs.file_id

INNER JOIN marking_guide mg 
    ON ar.marking_guide_id = mg.marking_guide_id

INNER JOIN file_storage fg 
    ON mg.file_id = fg.file_id

INNER JOIN assessment a 
    ON s.assessment_id = a.assessment_id

ORDER BY ar.analysis_result_id DESC
    `);

    return result.recordset;
};


module.exports = {
    runAIAnalysis,
    saveAnalysisToDB,
    getAnalysisResults,
    getAllEvaluatedResults
};