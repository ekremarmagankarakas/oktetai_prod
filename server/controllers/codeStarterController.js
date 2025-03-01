const { runAIChat } = require('../middleware/aiClient');
const validateInput = require('../middleware/validationMiddleware');
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Render Code Starter Page
exports.renderCodeStarterPage = (req, res) => {
  res.render("code-starter");
};

// Generate Project
exports.generateProject = [
  validateInput(["language", "method", "idea"]),
  async (req, res) => {
    try {
      const { language, method, idea } = req.body;
      const prompt = `
        Create a file hierarchy and code for the following project:
        Project Idea: "${idea}"
        Programming Language: ${language}
        Preferred Programming Method: ${method}
    
        Include separate files for different classes, utilities, and functions. 
        Return a structured hierarchy and the code for each file. Seperate each file with ----FileName----
        For directories, use forward slashes in file paths (e.g., src/utils/helper.py).
        
        Example output for python: note that the hirearchy and functions should be different in each case and language and the hirearchy should follow the norms of the language
        ----FileHierarchy.txt----
        todo.py
          utils/helper.py
    
        ----todo.py----
        def add_task(task):
            # Code to add a task
            print(f"Added task: {task}")
    
        ----utils/helper.py----
        def helper_function():
            # Code for helper function
            print("Helper function called")
      `;
      const content = await runAIChat({ prompt });
      res.json({ content, prompt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Suggest Completion
exports.suggestCompletion = [
  validateInput(["codeContext", "cursorPosition"]),
  async (req, res) => {
    try {
      const { codeContext, cursorPosition } = req.body;
      const prompt = `
        You are given a code snippet along with the cursor position. Suggest the next line or continuation from where the cursor is placed.
        Code snippet:
        ${codeContext}
        Cursor is located at character index ${cursorPosition}.
        Provide a suggestion for the code starting from this cursor position. Only include the code for the next line or the next logical continuation.
      `;
      const content = await runAIChat({ prompt });
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Process Prompt
exports.processPrompt = [
  validateInput(["prompt", "conversationHistory", "currentContent", "filePath"]),
  async (req, res) => {
    try {
      const { prompt, conversationHistory, currentContent, filePath } = req.body;
      const aiPrompt = `
        Please modify or add to the code below according to the user's request.
        ${currentContent} at ${filePath}
        Do not include any explanations, comments, or extra text beyond the code itself. 
        User's prompt:
        ${prompt}
      `;
      conversationHistory.push({ role: "user", content: aiPrompt });
      const content = await runAIChat({ prompt: conversationHistory });
      res.json({ content, aiPrompt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Process Prompt
exports.processPrompt = [
  validateInput(["prompt", "conversationHistory", "currentContent", "filePath"]),
  async (req, res) => {
    try {
      const { prompt, conversationHistory, currentContent, filePath } = req.body;
      const aiPrompt = `
        Please modify or add to the code below according to the user's request.
        ${currentContent} at ${filePath}
        Do not include any explanations, comments, or extra text beyond the code itself. 
        User's prompt:
        ${prompt}
      `;
      conversationHistory.push({ role: "user", content: aiPrompt });
      const content = await runAIChat({ prompt: conversationHistory });
      res.json({ content, aiPrompt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Update Project
exports.updateProject = [
  validateInput(["prompt", "conversationHistory"]),
  async (req, res) => {
    try {
      const { prompt, conversationHistory } = req.body;
      const aiPrompt = `
        Please modify or add to the code according to the user's request.
        Include separate files for different classes, utilities, and functions. 
        Return a structured hierarchy and the code for each file. Separate each file with ----FileName----.
        For directories, use forward slashes in file paths (e.g., src/utils/helper.py).
        ${prompt}
      `;
      conversationHistory.push({ role: "user", content: aiPrompt });
      const content = await runAIChat({ prompt: conversationHistory });
      res.json({ content, aiPrompt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Download Project Files
exports.downloadProject = (req, res) => {
  const { files } = req.body;

  if (!files || files.length === 0) {
    return res.status(400).send("No files to download");
  }

  const zipPath = path.join(__dirname, `project_${Date.now()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    res.download(zipPath, (err) => {
      if (err) {
        console.error("Error downloading zip:", err);
      }
      fs.unlinkSync(zipPath);
    });
  });

  archive.on("error", (err) => {
    console.error("Error creating zip:", err);
    res.status(500).send("Error creating zip file");
  });

  archive.pipe(output);

  files.forEach((file) => {
    if (file.path && typeof file.path === "string" && file.path.trim() !== "") {
      archive.append(file.content, { name: file.path });
    } else {
      console.error("Invalid file path:", file);
    }
  });

  archive.finalize();
};
