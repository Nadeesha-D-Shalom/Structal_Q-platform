const express = require("express");
const router = express.Router();
const axios = require("axios");
const { ML_SERVICE_URL } = require("../../config/env");

const { analyzeSubmission, getAnalysisResults } = require("./aiAnalysis.controller");

// Main analysis endpoint
router.post("/analyze", analyzeSubmission);

// Get analysis results
router.get("/results/:submissionId", getAnalysisResults);

// Compare documents
router.post("/compare", async (req, res) => {
    try {
        const { file1, file2 } = req.body;

        if (!file1 || !file2) {
            return res.status(400).json({
                success: false,
                error: "file1 and file2 are required"
            });
        }

        console.log("COMPARE REQUEST:");
        console.log("File1:", file1);
        console.log("File2:", file2);

        const response = await axios.post(`${ML_SERVICE_URL}/compare`, {
            file1: file1,
            file2: file2
        });

        const ai = response.data;

        const similarity = parseFloat(
            ai.similarity_score ?? ai.similarity ?? 0
        );

        return res.status(200).json({
            success: true,
            data: {
                similarity: similarity,
                similarity_percentage: (similarity * 100).toFixed(2),
                interpretation: ai.interpretation || "No interpretation"
            }
        });

    } catch (error) {
        console.error("Compare API Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;