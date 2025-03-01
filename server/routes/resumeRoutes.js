const express = require("express");
const resumeController = require("../controllers/resumeController");

const router = express.Router();

router.get("/resume", resumeController.renderResumePage);
router.post("/get-improvements", resumeController.generateImprovements);
router.post("/update-resume", resumeController.updateResume);
router.post("/generate-custom-cover-letter", resumeController.generateCustomCoverLetter);
router.post("/update-cover-letter", resumeController.updateCoverLetter);
// router.post("/start-interview", resumeController.startInterview);
// router.post("/follow-up-question", resumeController.followUpQuestion);
// router.post("/end-interview", resumeController.endInterview);
router.post("/download-docx", resumeController.downloadDocx);
router.post("/download-pdf", resumeController.downloadPdf);

module.exports = router;
