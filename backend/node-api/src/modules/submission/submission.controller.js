const service = require('./submission.service');

exports.uploadSubmission = async (req, res) => {
    try {
        const result = await service.upload(req);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getStudentSubmissions = async (req, res) => {
    const data = await service.getByStudent(req.params.id);
    res.json(data);
};

exports.getAIMetadata = async (req, res) => {
    const data = await service.getAIMetadata(req.params.id);
    res.json(data);
};

exports.softDeleteSubmission = async (req, res) => {
    await service.softDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
};