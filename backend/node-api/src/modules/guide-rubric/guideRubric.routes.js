const express = require('express');
const router = express.Router();
const controller = require('./guideRubric.controller');

router.post('/', controller.createRubric);
router.get('/', controller.getRubrics);
router.put('/:id', controller.updateRubric);
router.delete('/:id', controller.deleteRubric);

module.exports = router;