const express = require('express');
const router = express.Router();
const controller = require('./markingGuide.controller');

router.post('/', controller.createGuide);

router.post('/:id/new-version', controller.createNewVersion);

router.get('/', controller.getGuides);
router.get('/:id', controller.getGuideById);
router.put('/:id', controller.updateGuide);
router.delete('/:id', controller.deleteGuide);

module.exports = router;