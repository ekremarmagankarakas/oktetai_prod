const express = require("express");
const essayController = require("../controllers/essayController");

const router = express.Router();

router.post("/update-essay", essayController.updateEssay);
router.post(
  "/generate-inline-suggestions",
  essayController.generateInlineSuggestions,
);
router.post("/paraphrase", essayController.paraphrase);
router.post("/aidetect", essayController.aidetect);

module.exports = router;
