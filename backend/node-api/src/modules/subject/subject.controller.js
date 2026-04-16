const { pool, poolConnect, sql } = require("../../config/db");

// Notes:
// - This module is used by lecturer pages (ex: ML analysis config/portal) for dropdown population.
// - We keep behavior simple and aligned with `databse/alltables.sql`:
//   dbo.subject(subject_id, subject_code, subject_name, credit_value, department, status, created_at, updated_at)

exports.getSubjects = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT
        subject_id,
        subject_code,
        subject_name,
        credit_value,
        department,
        status,
        created_at,
        updated_at
      FROM subject
      WHERE ISNULL(status, 'ACTIVE') = 'ACTIVE'
      ORDER BY subject_name ASC;
    `);

    res.json(result.recordset || []);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Invalid subject id" });
    }

    await poolConnect;
    const result = await pool
      .request()
      .input("id", sql.BigInt, subjectId)
      .query(`
        SELECT
          subject_id,
          subject_code,
          subject_name,
          credit_value,
          department,
          status,
          created_at,
          updated_at
        FROM subject
        WHERE subject_id = @id;
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const {
      subject_code,
      subject_name,
      credit_value,
      department,
      status,
    } = req.body || {};

    if (!subject_code || !subject_name) {
      return res
        .status(400)
        .json({ success: false, error: "subject_code and subject_name are required" });
    }

    await poolConnect;
    const result = await pool
      .request()
      .input("subject_code", sql.NVarChar(255), subject_code)
      .input("subject_name", sql.NVarChar(255), subject_name)
      .input("credit_value", sql.Int, credit_value ?? null)
      .input("department", sql.NVarChar(255), department ?? null)
      .input("status", sql.NVarChar(255), status ?? "ACTIVE")
      .query(`
        INSERT INTO subject (
          subject_code,
          subject_name,
          credit_value,
          department,
          status,
          created_at,
          updated_at
        )
        OUTPUT INSERTED.subject_id AS subject_id
        VALUES (
          @subject_code,
          @subject_name,
          @credit_value,
          @department,
          @status,
          GETDATE(),
          GETDATE()
        );
      `);

    const subjectId = result.recordset?.[0]?.subject_id;
    res.status(201).json({ success: true, message: "Subject created", subject_id: subjectId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Invalid subject id" });
    }

    const {
      subject_code,
      subject_name,
      credit_value,
      department,
      status,
    } = req.body || {};

    await poolConnect;
    await pool
      .request()
      .input("id", sql.BigInt, subjectId)
      .input("subject_code", sql.NVarChar(255), subject_code ?? null)
      .input("subject_name", sql.NVarChar(255), subject_name ?? null)
      .input("credit_value", sql.Int, credit_value ?? null)
      .input("department", sql.NVarChar(255), department ?? null)
      .input("status", sql.NVarChar(255), status ?? null)
      .query(`
        UPDATE subject
        SET
          subject_code = COALESCE(@subject_code, subject_code),
          subject_name = COALESCE(@subject_name, subject_name),
          credit_value = COALESCE(@credit_value, credit_value),
          department = COALESCE(@department, department),
          status = COALESCE(@status, status),
          updated_at = GETDATE()
        WHERE subject_id = @id;
      `);

    res.json({ success: true, message: "Subject updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Invalid subject id" });
    }

    // Soft delete: mark as INACTIVE (keeps FK safety in other tables).
    await poolConnect;
    await pool
      .request()
      .input("id", sql.BigInt, subjectId)
      .query(`
        UPDATE subject
        SET status = 'INACTIVE',
            updated_at = GETDATE()
        WHERE subject_id = @id;
      `);

    res.json({ success: true, message: "Subject deleted (soft)" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
