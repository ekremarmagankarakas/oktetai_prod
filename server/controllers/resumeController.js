const { runAIChat } = require('../middleware/aiClient');
const validateInput = require('../middleware/validationMiddleware');
const { Document, Packer, Paragraph, TextRun } = require("docx");
const PDFDocument = require("pdfkit");

// Render Resume Page
exports.renderResumePage = (req, res) => {
  res.render("resume");
};

// Generate Resume Improvements
exports.generateImprovements = [
  validateInput(["aiPrompt"]),
  async (req, res) => {
    try {
      const { aiPrompt } = req.body;
      const prompt = `
      Suggest improvements for formatting, wording, and skill emphasis for the resume. Do not output the resume again. Just explain how it can be improved:
      \n\nResume: ${aiPrompt}`;
      const content = await runAIChat({ prompt });
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Update Resume
exports.updateResume = [
  validateInput(["aiPrompt", "content"]),
  async (req, res) => {
    try {
      const { aiPrompt, content } = req.body;
      const prompt = `
        Update the contents of the resume based on the given prompt. Always output the full resume:
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

// Generate Custom Cover Letter
exports.generateCustomCoverLetter = [
  validateInput(["aiPrompt", "content"]),
  async (req, res) => {
    try {
      const { aiPrompt, content } = req.body;
      const prompt = `
        Create a cover letter based on the following information:
        \n\nResume: ${aiPrompt}
        \n\nJob Description: ${content}
      `;
      const customCoverLetter = await runAIChat({ prompt });
      res.json({ content: customCoverLetter });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Update Cover Letter
exports.updateCoverLetter = [
  validateInput(["aiPrompt", "content"]),
  async (req, res) => {
    try {
      const { aiPrompt, content } = req.body;
      const prompt = `
        Update the contents of the cover letter based on the given prompt. Always output the full cover letter:
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

// // Start Interview
// exports.startInterview = async (req, res) => {
//   try {
//     const { resumeText, jobDescription } = req.body;

//     if (!resumeText || !jobDescription) {
//       return res.status(400).json({ error: "Resume text and job description are required." });
//     }

//     const prompt = `
//     You are a job interviewer. Based on the following resume and job description, start an interview by asking a question.
//     \n\nResume: ${resumeText}
//     \n\nJob Description: ${jobDescription}
//     `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: max_tokens,
//     });

//     const initialQuestion = response.choices[0].message.content;

//     res.json({ initialQuestion });
//   } catch (error) {
//     console.error("Error starting interview:", error);
//     res.status(500).json({ error: "Failed to start interview" });
//   }
// };

// // Follow-up Interview Question
// exports.followUpQuestion = async (req, res) => {
//   try {
//     const { conversation } = req.body;

//     if (!conversation || !Array.isArray(conversation)) {
//       return res.status(400).json({ error: "Conversation is required." });
//     }

//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: conversation,
//       max_tokens: max_tokens,
//     });

//     const followUpQuestion = response.choices[0].message.content;

//     res.json({ followUpQuestion });
//   } catch (error) {
//     console.error("Error getting follow-up question:", error);
//     res.status(500).json({ error: "Failed to get follow-up question" });
//   }
// };

// // End Interview and Provide Suggestions
// exports.endInterview = async (req, res) => {
//   try {
//     const { conversation } = req.body;

//     if (!conversation || !Array.isArray(conversation)) {
//       return res.status(400).json({ error: "Conversation is required." });
//     }

//     const prompt = `
//     Here is the interview conversation:\n
//     ${conversation.map((c) => `${c.role}: ${c.content}`).join("\n")}\n
//     Provide suggestions and improvements for the answers given. Focus on clarity, completeness, and confidence.
//     `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: max_tokens,
//     });

//     const suggestions = response.choices[0].message.content;

//     res.json({ suggestions });
//   } catch (error) {
//     console.error("Error ending interview:", error);
//     res.status(500).json({ error: "Failed to end interview" });
//   }
// };

// Generate DOCX File
exports.downloadDocx = (req, res) => {
  const { content } = req.body;

  const doc = new Document({
    sections: [
      {
        children: content.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)],
            })
        ),
      },
    ],
  });

  Packer.toBuffer(doc)
    .then((buffer) => {
      res.setHeader("Content-Disposition", 'attachment; filename="document.docx"');
      res.send(buffer);
    })
    .catch((error) => {
      console.error("Error generating DOCX:", error);
      res.status(500).send("Failed to generate DOCX");
    });
};

// Generate PDF File
exports.downloadPdf = (req, res) => {
  const { content } = req.body;

  const pdfDoc = new PDFDocument();
  res.setHeader("Content-Disposition", 'attachment; filename="document.pdf"');

  pdfDoc.pipe(res);
  pdfDoc.fontSize(10).text(content);
  pdfDoc.end();
};
