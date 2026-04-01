// Stub controller — to be implemented by the marking-guide module owner
const notImplemented = (req, res) =>
    res.status(501).json({ success: false, message: 'Not implemented yet' });

const createGuide   = notImplemented;
const getGuides     = notImplemented;
const getGuideById  = notImplemented;
const updateGuide   = notImplemented;
const deleteGuide   = notImplemented;

module.exports = { createGuide, getGuides, getGuideById, updateGuide, deleteGuide };
