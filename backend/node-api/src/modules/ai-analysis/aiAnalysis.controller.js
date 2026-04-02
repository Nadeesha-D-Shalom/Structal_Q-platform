const {
    runAIAnalysis,
    saveAnalysisToDB,
    getAnalysisResults
} = require("./aiAnalysis.service");


// ================= NORMALIZE AI RESPONSE =================
function normalizeAIResponse(result) {
    if (!result) return null;

    // Case 1: { data: {...} }
    if (result.data) return result.data;

    // Case 2: { result: {...} }
    if (result.result) return result.result;

    // Case 3: direct object
    return result;
}


// ================= MAIN CONTROLLER =================
async function analyzeSubmission(req, res) {
    try {
        const {
            submission_id,
            marking_guide_id,
            submission_path,
            guide_file
        } = req.body;

        // ===== VALIDATION =====
        if (
            !submission_id ||
            !marking_guide_id ||
            !submission_path ||
            !guide_file
        ) {
            return res.status(400).json({
                success: false,
                error: "submission_id, marking_guide_id, submission_path, guide_file are required"
            });
        }

        console.log("===== AI ANALYSIS START =====");
        console.log("Submission ID:", submission_id);
        console.log("Guide ID:", marking_guide_id);

        // ===== STEP 1: CALL AI =====
        const result = await runAIAnalysis({
            submission_path,
            guide_file
        });

        console.log("AI RAW RESPONSE:", result);

        // ===== STEP 2: NORMALIZE =====
        const aiData = normalizeAIResponse(result);

        if (!aiData) {
            throw new Error("AI response is empty or invalid");
        }

        console.log("AI NORMALIZED DATA:");
        console.log("Final Score:", aiData.final_score);
        console.log("Semantic Similarity:", aiData.semantic_similarity);

        // ===== STEP 3: SAVE TO DB =====
        const dbResult = await saveAnalysisToDB({
            submission_id,
            marking_guide_id,
            aiResult: aiData
        });

        console.log("DB INSERT SUCCESS");
        console.log("Analysis Result ID:", dbResult.analysis_result_id);

        // ===== RESPONSE =====
        return res.status(200).json({
            success: true,
            message: "AI analysis completed & saved successfully",
            analysis_result_id: dbResult.analysis_result_id,
            data: aiData
        });

    } catch (error) {
        console.error("===== CONTROLLER ERROR =====");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
}


module.exports = {
    analyzeSubmission,
    getAnalysisResults: async (req, res) => {
        try {
            const { submissionId } = req.params;

            if (!submissionId) {
                return res.status(400).json({
                    success: false,
                    error: "submission_id is required"
                });
            }

            const result = await getAnalysisResults(submissionId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: "No analysis results found for this submission"
                });
            }

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error("Get Analysis Results Controller Error:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
        }
    }
};