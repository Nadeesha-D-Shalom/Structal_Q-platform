const { pool, poolConnect, sql } = require("../../config/db");

/**
 * Tables (live schema):
 * - student_group (group_id PK, assessment_id FK, group_name nvarchar(510), created_at)
 *   UNIQUE (assessment_id, group_name)
 * - group_member (group_member_id PK, group_id FK, student_id FK -> [user], role_in_group nvarchar(100))
 */

async function assertAssessmentExists(assessmentId) {
  const r = await pool
    .request()
    .input("id", sql.BigInt, assessmentId)
    .query(`SELECT 1 AS ok FROM assessment WHERE assessment_id = @id`);
  return (r.recordset || []).length > 0;
}

async function assertStudentExists(studentId) {
  const r = await pool
    .request()
    .input("id", sql.BigInt, studentId)
    .query(`SELECT 1 AS ok FROM [user] WHERE user_id = @id`);
  return (r.recordset || []).length > 0;
}

exports.listGroupsByAssessment = async (assessmentId) => {
  await poolConnect;
  const result = await pool
    .request()
    .input("aid", sql.BigInt, assessmentId)
    .query(`
      SELECT
        sg.*,
        (
          SELECT COUNT(*) FROM group_member gm WHERE gm.group_id = sg.group_id
        ) AS member_count
      FROM student_group sg
      WHERE sg.assessment_id = @aid
      ORDER BY sg.group_id ASC;
    `);
  return result.recordset || [];
};

exports.getGroupDetail = async (groupId) => {
  await poolConnect;
  const g = await pool
    .request()
    .input("gid", sql.BigInt, groupId)
    .query(`
      SELECT *
      FROM student_group
      WHERE group_id = @gid;
    `);
  if (!g.recordset?.length) return null;

  const members = await pool
    .request()
    .input("gid", sql.BigInt, groupId)
    .query(`
      SELECT
        gm.group_member_id,
        gm.group_id,
        gm.student_id,
        gm.role_in_group,
        ISNULL(u.first_name, '') AS first_name,
        ISNULL(u.last_name, '') AS last_name,
        u.email
      FROM group_member gm
      INNER JOIN [user] u ON u.user_id = gm.student_id
      WHERE gm.group_id = @gid
      ORDER BY u.last_name, u.first_name;
    `);

  return {
    ...g.recordset[0],
    members: members.recordset || [],
  };
};

exports.createGroup = async ({ assessment_id, group_name }) => {
  await poolConnect;
  const ok = await assertAssessmentExists(assessment_id);
  if (!ok) {
    const err = new Error("Assessment not found");
    err.statusCode = 404;
    throw err;
  }

  const name =
    group_name != null && String(group_name).trim() !== ""
      ? String(group_name).trim() 
      : `Group ${Date.now()}`;

  const dup = await pool
    .request()
    .input("aid", sql.BigInt, assessment_id)
    .input("name", sql.NVarChar(510), name)
    .query(`
      SELECT TOP 1 group_id
      FROM student_group
      WHERE assessment_id = @aid
        AND LOWER(LTRIM(RTRIM(group_name))) = LOWER(LTRIM(RTRIM(@name)));
    `);
  if (dup.recordset?.length) {
    const err = new Error("A group with this name already exists for this assessment");
    err.statusCode = 409;
    throw err;
  }

  const ins = await pool
    .request()
    .input("aid", sql.BigInt, assessment_id)
    .input("name", sql.NVarChar(510), name)
    .query(`
      INSERT INTO student_group (assessment_id, group_name)
      OUTPUT INSERTED.*
      VALUES (@aid, @name);
    `);

  return ins.recordset[0];
};

exports.addMember = async ({ group_id, student_id, role_in_group }) => {
  await poolConnect;
  const g = await pool
    .request()
    .input("gid", sql.BigInt, group_id)
    .query(`SELECT group_id FROM student_group WHERE group_id = @gid`);
  if (!g.recordset?.length) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  const st = await assertStudentExists(student_id);
  if (!st) {
    const err = new Error("Student (user) not found");
    err.statusCode = 404;
    throw err;
  }

  const existing = await pool
    .request()
    .input("gid", sql.BigInt, group_id)
    .input("sid", sql.BigInt, student_id)
    .query(`
      SELECT group_member_id FROM group_member
      WHERE group_id = @gid AND student_id = @sid;
    `);
  if (existing.recordset?.length) {
    const err = new Error("Student already in this group");
    err.statusCode = 409;
    throw err;
  }

  const role =
    role_in_group != null && String(role_in_group).trim() !== ""
      ? String(role_in_group).trim().slice(0, 100)
      : null;

  try {
    const ins = await pool
      .request()
      .input("gid", sql.BigInt, group_id)
      .input("sid", sql.BigInt, student_id)
      .input("role", sql.NVarChar(100), role)
      .query(`
        INSERT INTO group_member (group_id, student_id, role_in_group)
        OUTPUT INSERTED.*
        VALUES (@gid, @sid, @role);
      `);
    return ins.recordset[0];
  } catch (e) {
    if (
      String(e.message).includes("UNIQUE") ||
      String(e.message).includes("duplicate") ||
      String(e.message).includes("2627")
    ) {
      const err = new Error("Student already in this group");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
};

exports.removeMember = async (group_id, student_id) => {
  await poolConnect;
  const r = await pool
    .request()
    .input("gid", sql.BigInt, group_id)
    .input("sid", sql.BigInt, student_id)
    .query(`
      DELETE FROM group_member
      WHERE group_id = @gid AND student_id = @sid;
    `);
  return r.rowsAffected?.[0] ?? 0;
};

exports.deleteGroup = async (group_id) => {
  await poolConnect;
  await pool
    .request()
    .input("gid", sql.BigInt, group_id)
    .query(`DELETE FROM group_member WHERE group_id = @gid;`);

  const r = await pool
    .request()
    .input("gid", sql.BigInt, group_id)
    .query(`DELETE FROM student_group WHERE group_id = @gid;`);

  return r.rowsAffected?.[0] ?? 0;
};
