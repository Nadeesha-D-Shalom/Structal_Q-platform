const express = require('express');
const router = express.Router();
const controller = require('./guideQuestion.controller');

router.post('/', controller.createQuestion);
router.get('/', controller.getQuestions);
router.get('/:id', controller.getQuestionById);
router.put('/:id', controller.updateQuestion);
router.put('/reorder', controller.reorderQuestions);
router.delete('/:id', controller.deleteQuestion);

module.exports = router;