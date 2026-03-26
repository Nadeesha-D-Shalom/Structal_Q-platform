const {
    runAIAnalysis,
    saveAnalysisToDB
} = require("./aiAnalysis.service");


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
                error: "submission_id, marking_guide_id, submission_path, and guide_file are required"
            });
        }

        // ===== AI CALL =====
        const result = await runAIAnalysis({
            submission_path,
            guide_file
        });

        // ===== CRITICAL FIX =====
        if (!result || !result.data) {
            throw new Error("Invalid AI response format");
        }

        const aiData = result.data;

        // ===== SAVE TO DB =====
        await saveAnalysisToDB({
            submission_id,
            marking_guide_id,
            aiResult: aiData
        });

        // ===== RESPONSE =====
        return res.status(200).json({
            success: true,
            message: "AI analysis completed & saved",
            data: aiData
        });

    } catch (error) {
        console.error("Controller Error:", error.message);

        return res.status(500).json({
            success: false,
            error: error.message || "AI analysis failed"
        });
    }
}


module.exports = {
    analyzeSubmission
};