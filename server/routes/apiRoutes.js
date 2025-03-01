const express = require("express");
const { createAIClient } = require("@armagank/llmrest");
const multer = require("multer");
const User = require("../models/user");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});
const router = express.Router();

const geminiAPI = process.env.GEMINI_API;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(geminiAPI);

const maxInput = 1 * 1024 * 1024;
const maxOutput = 1024;
const moderationEnabled = true;

let fileContents = "";
router.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size exceeds the limit of 1MB" });
      }
      return res.status(500).json({ error: "Error processing file" });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileName = req.file.originalname;

    try {
      if (fileType === "application/pdf") {
        // Handle PDF file
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        fileContents =
          "Uploaded pdf file contents / file contents: " + pdfData.text;
      } else if (fileType.startsWith("image/")) {
        // Handle image file
        const { GoogleAIFileManager } = require("@google/generative-ai/server");
        const fileManager = new GoogleAIFileManager(geminiAPI);
        const uploadResponse = await fileManager.uploadFile(filePath, {
          mimeType: fileType,
          displayName: fileName,
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: uploadResponse.file.uri,
            },
          },
          { text: "Transcribe the image." },
        ]);
        fileContents =
          "Image / Uploaded image contents: " + result.response.text();
      } else {
        // Handle other text files
        fileContents =
          "Uploaded file contents / file contents: " +
          fs.readFileSync(filePath, "utf8");
      }
      res.json({ message: "File uploaded and contents saved" });
    } catch (error) {
      res.status(500).json({ error: "Error processing file" });
    } finally {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
    }
  });
});

router.delete("/deletefile", (req, res) => {
  fileContents = "";
  res.json({ message: "File contents deleted" });
});

const resolveApiKeys = async (userId) => {
  try {
    // Fetch the user document and their API keys
    const user = await User.findById(userId).select("apiKeys");

    // Default to environment variables if no user-specific API key is available
    const apiKeys = {
      openai: user?.apiKeys?.openai || process.env.OPENAI_API,
      gemini: user?.apiKeys?.gemini || process.env.GEMINI_API,
      claude: user?.apiKeys?.claude || process.env.CLAUDE_API,
      perplexity: user?.apiKeys?.perplexity || process.env.PERPLEXITY_API,
    };

    return apiKeys;
  } catch (error) {
    console.error("Error resolving API keys:", error.message);
    throw error;
  }
};

const checkAllowedModels = (models, subscriptionPlan, apiKeys) => {
  if (!Array.isArray(models)) {
    models = [models];
  }

  const modelToProvider = {
    "gpt-4o": "openai",
    "gpt-3.5-turbo": "openai",
    "gemini-1.5-pro": "gemini",
    "gemini-1.5-flash": "gemini",
    "claude-3-sonnet-20240229": "claude",
    "claude-3-haiku-20240307": "claude",
    "llama-3.1-sonar-small-128k-online": "llama",
  };

  const restrictedModels = {
    enterprise: [
      "llama-3.1-sonar-small-128k-online",
      "claude-3-sonnet-20240229",
      "gemini-1.5-pro",
    ],
    basic: ["gpt-4o", "claude-3-haiku-20240307"],
  };

  return models.filter((model) => {
    provider = modelToProvider[model];
    // if the user has an API key for the model, allow it
    if (provider && apiKeys[provider]) {
      return true;
    }

    // Fallback to subscription plan restrictions
    if (
      restrictedModels.enterprise.includes(model) &&
      subscriptionPlan !== "enterprise"
    ) {
      return false;
    }
    if (
      restrictedModels.basic.includes(model) &&
      subscriptionPlan === "basic"
    ) {
      return false;
    }
    return true;
  });
};

router.post("/api/chat-single", async (req, res) => {
  const { models, messages } = req.body;
  const subscriptionPlan = req.user.subscriptionPlan;
  const userId = req.user._id;

  const apiKeys = await resolveApiKeys(userId);
  const aiClient = createAIClient({ apiKeys });
  const allowedModels = checkAllowedModels(models, subscriptionPlan, apiKeys);

  if (fileContents) {
    messages.unshift({
      role: "system",
      content: `File contents: ${fileContents}`,
    });
  }

  // Call the AI client to get the stream
  const result = await aiClient.createChat({
    models: allowedModels,
    messages,
    maxInput,
    maxOutput,
    moderationEnabled,
  });

  res.json({ content: result[models[0]] });
});

module.exports = router;
