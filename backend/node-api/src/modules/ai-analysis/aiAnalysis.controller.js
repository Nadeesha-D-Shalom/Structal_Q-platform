const {
    runAIAnalysis,
    saveAnalysisToDB,
    getAnalysisResults,
    getAllEvaluatedResults
} = require("./aiAnalysis.service");

const submissionService = require("../submission/submission.service");

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


// ================= EXPORT =================
module.exports = {
    analyzeSubmission,
    evaluateAllSubmissions,
    getAllEvaluatedResults: getAllEvaluatedResultsController,
    getAnalysisResults: getResultsController
};