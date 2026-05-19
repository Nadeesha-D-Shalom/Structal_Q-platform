const express = require('express');
const router = express.Router();
const controller = require('./subject.controller');

// SUBJECT
router.get("/", controller.getSubjects);
router.post("/", controller.createSubject);
router.put("/:id", controller.updateSubject);
router.delete("/:id", controller.deleteSubject);

// OFFERING
router.get("/offerings", controller.listSubjectOfferings);
router.post("/offerings", controller.createSubjectOffering);
router.put("/offerings/:id", controller.updateSubjectOffering);  
router.delete("/offerings/:id", controller.deleteSubjectOffering); 


module.exports = router;