const {
    runAIAnalysis,
    saveAnalysisToDB
} = require("./aiAnalysis.service");


function normalizeAIResponse(result) {
    if (!result) return null;

    // Case 1: { data: {...} }
    if (result.data) return result.data;

    // Case 2: { result: {...} }
    if (result.result) return result.result;

    // Case 3: direct object
    return result;
}


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

        // ===== AI CALL =====
        const result = await runAIAnalysis({
            submission_path,
            guide_file
        });

        console.log("AI RAW RESPONSE:", result);

        // ===== NORMALIZE =====
        const aiData = normalizeAIResponse(result);

        if (!aiData) {
            throw new Error("AI response is empty");
        }

        // ===== SAVE =====
        await saveAnalysisToDB({
            submission_id,
            marking_guide_id,
            aiResult: aiData
        });

        return res.status(200).json({
            success: true,
            message: "AI analysis completed & saved",
            data: aiData
        });

    } catch (error) {
        console.error("Controller Error:", error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


module.exports = {
    analyzeSubmission
};