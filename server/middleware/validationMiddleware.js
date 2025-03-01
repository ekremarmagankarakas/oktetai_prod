const validateInput = (requiredFields) => (req, res, next) => {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `${field} is required.` });
    }
  }
  next();
};

module.exports = validateInput;