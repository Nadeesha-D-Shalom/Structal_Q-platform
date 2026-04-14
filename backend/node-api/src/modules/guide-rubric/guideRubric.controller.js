const { sql, poolPromise } = require('../../config/db');

// CREATE
exports.createRubric = async (req, res) => {
  const { marking_guide_id, criterion_name, description, max_marks, weight } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('marking_guide_id', sql.Int, marking_guide_id)
      .input('criterion_name', sql.NVarChar, criterion_name)
      .input('description', sql.NVarChar, description)
      .input('max_marks', sql.Decimal(5,2), max_marks)
      .input('weight', sql.Decimal(5,2), weight)
      .query(`
        INSERT INTO guide_rubric_item
        (marking_guide_id, criterion_name, description, max_marks, weight)
        VALUES
        (@marking_guide_id, @criterion_name, @description, @max_marks, @weight)
      `);

    res.status(201).json({ message: "Rubric created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// GET ALL
exports.getRubrics = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * FROM guide_rubric_item
      ORDER BY rubric_item_id DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UPDATE
exports.updateRubric = async (req, res) => {
  const { criterion_name, description, max_marks, weight } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('criterion_name', sql.NVarChar, criterion_name)
      .input('description', sql.NVarChar, description)
      .input('max_marks', sql.Decimal(5,2), max_marks)
      .input('weight', sql.Decimal(5,2), weight)
      .query(`
        UPDATE guide_rubric_item
        SET
          criterion_name = @criterion_name,
          description = @description,
          max_marks = @max_marks,
          weight = @weight,
          updated_at = GETDATE()
        WHERE rubric_item_id = @id
      `);

    res.json({ message: "Updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// DELETE
exports.deleteRubric = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        DELETE FROM guide_rubric_item
        WHERE rubric_item_id = @id
      `);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};