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

    const codeNorm = String(subject_code).trim();
    await poolConnect;

    const dup = await pool
      .request()
      .input("code", sql.NVarChar(255), codeNorm)
      .query(`
        SELECT TOP 1 subject_id FROM subject
        WHERE LOWER(LTRIM(RTRIM(subject_code))) = LOWER(LTRIM(RTRIM(@code)));
      `);
    if (dup.recordset?.length) {
      return res.status(409).json({
        success: false,
        error: "A subject with this subject_code already exists",
      });
    }

    const result = await pool
      .request()
      .input("subject_code", sql.NVarChar(255), codeNorm)
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

    if (subject_code != null && String(subject_code).trim() !== "") {
      const codeNorm = String(subject_code).trim();
      const clash = await pool
        .request()
        .input("id", sql.BigInt, subjectId)
        .input("code", sql.NVarChar(255), codeNorm)
        .query(`
          SELECT TOP 1 subject_id FROM subject
          WHERE subject_id <> @id
            AND LOWER(LTRIM(RTRIM(subject_code))) = LOWER(LTRIM(RTRIM(@code)));
        `);
      if (clash.recordset?.length) {
        return res.status(409).json({
          success: false,
          error: "Another subject already uses this subject_code",
        });
      }
    }

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

/** All offerings with subject labels — for lecturer assignment / lab mapping */
exports.listSubjectOfferings = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT
        so.offering_id,
        so.subject_id,
        so.academic_year,
        so.semester,
        so.intake_name,
        so.is_active,
        s.subject_code,
        s.subject_name
      FROM subject_offering so
      INNER JOIN subject s ON s.subject_id = so.subject_id
      ORDER BY s.subject_name ASC, so.academic_year DESC, so.semester DESC;
    `);
    res.json({ success: true, data: result.recordset || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSubjectOffering = async (req, res) => {
  try {
    const { subject_id, academic_year, semester, intake_name } = req.body || {};
    const sid = Number(subject_id);
    if (!sid) {
      return res.status(400).json({ success: false, error: "subject_id is required" });
    }
    await poolConnect;
    const exists = await pool
      .request()
      .input("id", sql.BigInt, sid)
      .query(`SELECT TOP 1 subject_id FROM subject WHERE subject_id = @id`);
    if (!exists.recordset?.length) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }
    const result = await pool
      .request()
      .input("subject_id", sql.BigInt, sid)
      .input("academic_year", sql.NVarChar(255), academic_year || null)
      .input("semester", sql.NVarChar(255), semester || null)
      .input("intake_name", sql.NVarChar(255), intake_name || null)
      .query(`
        INSERT INTO subject_offering (subject_id, academic_year, semester, intake_name, is_active, created_at, updated_at)
        OUTPUT INSERTED.offering_id AS offering_id
        VALUES (@subject_id, @academic_year, @semester, @intake_name, 1, GETDATE(), GETDATE());
      `);
    const offeringId = result.recordset?.[0]?.offering_id;
    res.status(201).json({ success: true, offering_id: offeringId });
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
