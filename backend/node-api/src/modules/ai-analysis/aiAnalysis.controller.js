const {
    runAIAnalysis,
    saveAnalysisToDB,
    getAnalysisResults
} = require("./aiAnalysis.service");

const service = require("./aiAnalysis.service");

// ================= NORMALIZE AI RESPONSE =================
function normalizeAIResponse(result) {
    if (!result) return null;
    if (result.data) return result.data;
    if (result.result) return result.result;
    return result;
}

// ================= SINGLE ANALYSIS =================
async function analyzeSubmission(req, res) {
    try {
        const {
            submission_id,
            marking_guide_id,
            submission_path,
            guide_file
        } = req.body;

        if (
            !submission_id ||
            !marking_guide_id ||
            !submission_path ||
            !guide_file
        ) {
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

        const dbResult = await saveAnalysisToDB({
            submission_id,
            marking_guide_id,
            aiResult: aiData
        });

        return res.status(200).json({
            success: true,
            analysis_result_id: dbResult.analysis_result_id,
            data: aiData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ================= EVALUATE ALL =================
async function evaluateAllSubmissions(req, res) {
    try {
        const { assessmentId } = req.params;

        const submissions = await service.getSubmissionsByAssessment(assessmentId);

        if (!submissions.length) {
            return res.status(404).json({
                success: false,
                message: "No submissions found"
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

                await saveAnalysisToDB({
                    submission_id: sub.submission_id,
                    marking_guide_id: sub.marking_guide_id,
                    aiResult: aiData
                });

                results.push({
                    submission_id: sub.submission_id,
                    status: "success"
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
            total: submissions.length,
            results
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ================= GET RESULTS =================
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
    getAnalysisResults: getResultsController
};