const express = require("express");
const codeStarterController = require("../controllers/codeStarterController");

const router = express.Router();

router.get("/code-starter", codeStarterController.renderCodeStarterPage);
router.post("/generate-project", codeStarterController.generateProject);
router.post("/suggest-completion", codeStarterController.suggestCompletion);
router.post("/process-prompt", codeStarterController.processPrompt);
router.post("/update-project", codeStarterController.updateProject);
router.post("/download-project", codeStarterController.downloadProject);

module.exports = router;