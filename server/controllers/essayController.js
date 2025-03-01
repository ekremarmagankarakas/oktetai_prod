const { runAIChat } = require("../middleware/aiClient");
const { validateInput } = require("../middleware/validationMiddleware");

// Update Essay
exports.updateEssay = [
  validateInput(["aiPrompt", "content"]),
  async (req, res) => {
    try {
      const { aiPrompt, content } = req.body;
      const prompt = `
        Update the contents of the essay based on the given prompt. Always output the full essay:
        "prompt: ${aiPrompt}"
        "content: ${content}"
      `;
      const updatedContent = await runAIChat({ prompt });
      res.json({ content: updatedContent });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Generate Inline Suggestions
exports.generateInlineSuggestions = [
  validateInput(["aiPrompt"]),
  async (req, res) => {
    try {
      const { aiPrompt } = req.body;
      const prompt = `
        Suggest the next sentence or word for the following text. My cursor is at (cursor). ONLY output the suggestion:
        "${aiPrompt}"
      `;
      const suggestion = await runAIChat({ prompt, maxOutputOverride: 20 });
      res.json({ content: suggestion });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Paraphrase Text
exports.paraphrase = [
  validateInput(["aiPrompt"]),
  async (req, res) => {
    try {
      const { aiPrompt } = req.body;
      const prompt = `
        Paraphrase the following text. Output about the same number of sentences as the input text. Only output the paraphrased text:
        Text: "${aiPrompt}"
      `;
      const paraphrasedText = await runAIChat({ prompt });
      res.json({ content: paraphrasedText });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// AI Detect
exports.aidetect = [
  validateInput(["text"]),
  async (req, res) => {
    const { text } = req.body;

    // Check word limit
    const wordLimit = 1024 * 1024;
    const wordCount = text.split(/\s+/).length; // Count words by splitting on spaces
    if (wordCount > wordLimit) {
      return res
        .status(400)
        .json({ error: `Text exceeds the word limit of ${wordLimit} words` });
    }

    try {
      const response = await fetch("https://api.sapling.ai/api/v1/aidetect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: process.env.SAPLING_API,
          text,
        }),
      });

      const data = await response.json();
      const totalScore = data.score;
      const sentenceScores = data.sentence_scores;
      res.status(200).json({ totalScore, sentenceScores });
    } catch (err) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  },
];
