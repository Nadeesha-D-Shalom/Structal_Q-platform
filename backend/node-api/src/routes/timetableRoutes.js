const express = require('express');
const timetableController = require('../controllers/timetableController');
const {
  requireAdmin,
  requireStudentOrAdmin,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Register specific paths before /:id so "publish" is not captured as id.
router.get('/', requireStudentOrAdmin, timetableController.getAll);

router.post('/', requireStudentOrAdmin, requireAdmin, timetableController.create);

router.put(
  '/publish/:id',
  requireStudentOrAdmin,
  requireAdmin,
  timetableController.publish,
);

router.get('/:id', requireStudentOrAdmin, timetableController.getById);

router.put('/:id', requireStudentOrAdmin, requireAdmin, timetableController.update);

router.delete('/:id', requireStudentOrAdmin, requireAdmin, timetableController.remove);

module.exports = router;
