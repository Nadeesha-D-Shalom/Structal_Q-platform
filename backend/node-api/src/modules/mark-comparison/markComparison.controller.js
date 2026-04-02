const { compareAndSaveMarks } = require("./markComparison.service");

async function compareMarks(req, res) {
    try {
        const { submission_id } = req.body;

        if (!submission_id) {
            return res.status(400).json({
                success: false,
                error: "submission_id is required"
            });
        }

        const result = await compareAndSaveMarks({ submission_id });

        return res.status(200).json({
            success: true,
            message: "Mark comparison completed",
            data: result
        });
    } catch (error) {
        console.error("MARK COMPARISON CONTROLLER ERROR:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
}

module.exports = {
    compareMarks
};