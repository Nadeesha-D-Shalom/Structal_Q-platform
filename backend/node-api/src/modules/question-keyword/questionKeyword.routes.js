const express = require('express');
const router = express.Router();
const controller = require('./questionKeyword.controller');

router.post('/', controller.createKeyword);
router.get('/', controller.getKeywords);
router.get('/:id', controller.getKeywordById);
router.put('/:id', controller.updateKeyword);
router.delete('/:id', controller.deleteKeyword);

module.exports = router;