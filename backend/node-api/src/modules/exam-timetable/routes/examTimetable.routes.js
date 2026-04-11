const express = require('express');
const examTimetableController = require('../controllers/examTimetable.controller');
const {
  requireAdmin,
  requireStudentOrAdmin,
} = require('../../../middleware/authMiddleware');

const router = express.Router();

// Register specific paths before /:id so "publish" is not captured as id.
router.get('/', requireStudentOrAdmin, examTimetableController.getAll);

router.post('/', requireStudentOrAdmin, requireAdmin, examTimetableController.create);

router.put(
  '/publish/:id',
  requireStudentOrAdmin,
  requireAdmin,
  examTimetableController.publish,
);

router.get('/:id', requireStudentOrAdmin, examTimetableController.getById);

router.put('/:id', requireStudentOrAdmin, requireAdmin, examTimetableController.update);

router.delete('/:id', requireStudentOrAdmin, requireAdmin, examTimetableController.remove);

module.exports = router;
