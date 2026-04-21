const groupService = require("./group.service");

exports.listByAssessment = async (req, res) => {
  try {
    const assessmentId = Number(req.params.assessmentId);
    if (!assessmentId) {
      return res.status(400).json({ success: false, error: "Invalid assessmentId" });
    }
    const data = await groupService.listGroupsByAssessment(assessmentId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("listByAssessment", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ success: false, error: "Invalid groupId" });
    }
    const data = await groupService.getGroupDetail(groupId);
    if (!data) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error("getOne", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { assessment_id, group_name } = req.body || {};
    if (assessment_id == null || assessment_id === "") {
      return res.status(400).json({ success: false, error: "assessment_id is required" });
    }
    const row = await groupService.createGroup({
      assessment_id: Number(assessment_id),
      group_name,
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    const code = err.statusCode || 500;
    console.error("create group", err);
    return res.status(code).json({ success: false, error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { student_id, role_in_group } = req.body || {};
    if (!groupId || student_id == null) {
      return res.status(400).json({ success: false, error: "groupId and student_id are required" });
    }
    const row = await groupService.addMember({
      group_id: groupId,
      student_id: Number(student_id),
      role_in_group,
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    const code = err.statusCode || 500;
    console.error("addMember", err);
    return res.status(code).json({ success: false, error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const studentId = Number(req.params.studentId);
    if (!groupId || !studentId) {
      return res.status(400).json({ success: false, error: "Invalid groupId or studentId" });
    }
    const deleted = await groupService.removeMember(groupId, studentId);
    return res.json({ success: true, removed: deleted > 0 });
  } catch (err) {
    console.error("removeMember", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ success: false, error: "Invalid groupId" });
    }
    const deleted = await groupService.deleteGroup(groupId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteGroup", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
