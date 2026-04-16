const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require("path");
const fs = require("fs");
const controller = require('./markingGuide.controller');

const uploadDir = "storage/guides";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName =
      "guide_" +
      Date.now() +
      "_" +
      Math.round(Math.random() * 1e9) +
      ext;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', controller.createGuide);
router.post('/upload', upload.single('file'), controller.uploadGuide);
router.get('/', controller.getGuides);
router.get('/file/:fileId', controller.previewGuideFile);
router.get('/:id', controller.getGuideById);
router.put('/:id', controller.updateGuide);
router.delete('/:id', controller.deleteGuide);

module.exports = router;