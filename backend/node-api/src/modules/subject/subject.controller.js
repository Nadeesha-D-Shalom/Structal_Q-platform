// Stub controller — to be implemented by the subject module owner
const notImplemented = (req, res) =>
    res.status(501).json({ success: false, message: 'Not implemented yet' });

const createSubject   = notImplemented;
const getSubjects     = notImplemented;
const getSubjectById  = notImplemented;
const updateSubject   = notImplemented;
const deleteSubject   = notImplemented;

module.exports = { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject };
