const {
    runAIAnalysis,
    saveAnalysisToDB,
    getAnalysisResults,
    getAnalysisResultById,
    getAllEvaluatedResults
} = require("./aiAnalysis.service");

const submissionService = require("../submission/submission.service");
const { pool, sql } = require("../../config/db");

// ================= NORMALIZE =================
function normalizeAIResponse(result) {
    if (!result) return null;
    if (result.data) return result.data;
    if (result.result) return result.result;
    return result;
}


// ================= SINGLE =================
async function analyzeSubmission(req, res) {
    try {
        const {
            submission_id,
            marking_guide_id,
            submission_path,
            guide_file
        } = req.body;

        if (!submission_id || !marking_guide_id || !submission_path || !guide_file) {
            return res.status(400).json({
                success: false,
                error: "All fields are required"
            });
        }

        const result = await runAIAnalysis({
            submission_path,
            guide_file
        });

        const aiData = normalizeAIResponse(result);

        const saved = await saveAnalysisToDB({
            submission_id,
            marking_guide_id,
            aiResult: aiData
        });

        return res.json({
            success: true,
            analysis_result_id: saved.analysis_result_id
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}


// ================= EVALUATE ALL =================
async function evaluateAllSubmissions(req, res) {
    try {
        const { assessmentId } = req.params;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                error: "assessmentId is required"
            });
        }

        const submissions = await submissionService.getSubmissionsByAssessment(assessmentId);

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No submissions found"
            });
        }

        const results = [];

        for (const sub of submissions) {
            try {
                const aiResponse = await runAIAnalysis({
                    submission_path: sub.storage_path,
                    guide_file: sub.guide_path
                });

                const aiData = normalizeAIResponse(aiResponse);

                const saved = await saveAnalysisToDB({
                    submission_id: sub.submission_id,
                    marking_guide_id: sub.marking_guide_id,
                    aiResult: aiData
                });

                results.push({
                    submission_id: sub.submission_id,
                    status: "success",
                    analysis_result_id: saved.analysis_result_id
                });

            } catch (err) {
                results.push({
                    submission_id: sub.submission_id,
                    status: "failed",
                    error: err.message
                });
            }
        }

        return res.json({
            success: true,
            message: "All submissions evaluated",
            total: results.length,
            data: results
        });

    } catch (err) {
        console.error("Evaluate All Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}


// ================= GET ALL =================

const getAllEvaluatedResultsController = async (req, res) => {
    try {
        const data = await getAllEvaluatedResults();

        res.json({
            success: true,
            message: "All evaluated results",
            data
        });

    } catch (error) {
        console.error("Get All Evaluated Results Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// ================= GET SINGLE =================
async function getResultsController(req, res) {
    try {
        const { submissionId } = req.params;

        const result = await getAnalysisResults(submissionId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: "No results found"
            });
        }

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// ================= GET BY ANALYSIS ID =================
async function getAnalysisByIdController(req, res) {
    try {
        const { analysisResultId } = req.params;

        const result = await getAnalysisResultById(analysisResultId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: "No analysis result found"
            });
        }

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function fetchDiagramPagesForReport(submissionId) {
    const result = await pool.request()
        .input("sid", sql.BigInt, submissionId)
        .query(`
            SELECT 
                o.page_no,
                o.has_diagram,
                CAST(ISNULL(d.match_score, 0) * 10 AS DECIMAL(10,2)) AS clarity_score,
                CASE 
                    WHEN ISNULL(o.has_diagram, 0) = 1
                         AND (d.match_score IS NULL OR d.match_score < 0.5)
                    THEN 1 ELSE 0
                END AS manual_review_recommended,
                d.detected_labels,
                d.issues
            FROM ocr_page_result o
            LEFT JOIN diagram_check_result d
                ON d.analysis_result_id = o.analysis_result_id
                AND d.page_no = o.page_no
            WHERE o.analysis_result_id = (
                SELECT TOP 1 ar.analysis_result_id
                FROM analysis_result ar
                WHERE ar.submission_id = @sid
                ORDER BY ar.analysis_result_id DESC
            )
            AND ISNULL(o.has_diagram, 0) = 1
            ORDER BY o.page_no ASC;
        `);

    const parseJson = (val) => {
        if (val == null) return null;
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
            const trimmed = val.trim();
            if (!trimmed) return null;
            try { return JSON.parse(trimmed); } catch { return null; }
        }
        return null;
    };

    const normalizeIssues = (val) => {
        if (val == null) return null;
        if (Array.isArray(val)) return val.join(", ");
        if (typeof val === "string") {
            const parsed = parseJson(val);
            if (Array.isArray(parsed)) return parsed.join(", ");
            return val;
        }
        const parsed = parseJson(val);
        if (Array.isArray(parsed)) return parsed.join(", ");
        return null;
    };

    return (result.recordset || []).map((r) => {
        const detectedLabels = parseJson(r.detected_labels);
        return {
            page_no: r.page_no,
            has_diagram: !!r.has_diagram,
            clarity_score: r.clarity_score ?? 0,
            manual_review_recommended: !!r.manual_review_recommended,
            detected_labels: Array.isArray(detectedLabels) ? detectedLabels : [],
            issues: normalizeIssues(r.issues),
        };
    });
}

// ================= EXPORT JSON REPORT (SUBMISSION) =================
async function generateReportForSubmission(req, res) {
    try {
        const submissionId = Number(req.params.submissionId);
        if (!submissionId) {
            return res.status(400).json({ success: false, message: "Invalid submission id" });
        }

        const analysis = await getAnalysisResults(submissionId);
        if (!analysis) {
            return res.status(404).json({ success: false, message: "No analysis result found" });
        }

        const diagramPages = await fetchDiagramPagesForReport(submissionId);

        return res.json({
            success: true,
            data: {
                submission_id: submissionId,
                analysis,
                diagramPages,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ================= EXPORT JSON REPORT (ANALYSIS RESULT) =================
async function generateReportForAnalysisResultId(req, res) {
    try {
        const analysisResultId = Number(req.params.analysisResultId);
        if (!analysisResultId) {
            return res.status(400).json({ success: false, message: "Invalid analysis result id" });
        }

        const analysis = await getAnalysisResultById(analysisResultId);
        if (!analysis) {
            return res.status(404).json({ success: false, message: "No analysis result found" });
        }

        const submissionId = analysis.submission_id;
        const diagramPages = await fetchDiagramPagesForReport(submissionId);

        return res.json({
            success: true,
            data: {
                analysis_result_id: analysisResultId,
                submission_id: submissionId,
                analysis,
                diagramPages,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}


// ================= EXPORT =================
module.exports = {
    analyzeSubmission,
    evaluateAllSubmissions,
    getAllEvaluatedResults: getAllEvaluatedResultsController,
    getAnalysisResults: getResultsController,
    getAnalysisResultById: getAnalysisByIdController,
    generateReportForSubmission,
    generateReportForAnalysisResultId,
};