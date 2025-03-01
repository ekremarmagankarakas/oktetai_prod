const { createAIClient } = require('@armagank/llmrest');

const aiClient = createAIClient({
  apiKeys: {
    openai: process.env.OPENAI_API,
  },
});

const maxOutput = parseInt(process.env.MAX_TOKENS) || 1024 * 1024;
const maxInput = parseInt(process.env.MAX_INPUT_SIZE) || 1024 * 1024;
const moderationEnabled = true;
const defaultModels = ["gpt-3.5-turbo"];

const runAIChat = async ({ prompt, maxOutputOverride = maxOutput }) => {
  try {
    let messages;
    if (Array.isArray(prompt)) {
      messages = prompt;
    } else if (typeof prompt === "string") {
      messages = [{ role: "user", content: prompt }];
    } else {
      throw new Error("Invalid prompt type: must be a string or an array of objects.");
    }
    const result = await aiClient.createChat({
      models: defaultModels,
      messages,
      maxInput,
      maxOutput: maxOutputOverride,
      moderationEnabled,
    });
    return result[defaultModels[0]];
  } catch (error) {
    console.error("Error in AI interaction:", error);
    throw new Error("Failed to process AI request.");
  }
};

module.exports = { runAIChat };
