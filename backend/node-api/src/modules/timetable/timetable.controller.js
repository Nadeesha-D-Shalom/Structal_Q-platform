exports.getAllTimetables = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Timetable list fetched successfully",
            data: []
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};