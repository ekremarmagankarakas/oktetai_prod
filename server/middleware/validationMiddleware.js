const validateInput = (requiredFields) => (req, res, next) => {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `${field} is required.` });
    }
  }
  next();
};

// Enhanced validator for email format
const validateEmail = (email) => {
  // More comprehensive RFC 5322 compliant email validation
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  // Check for valid regex match
  const isValidFormat = emailRegex.test(email);
  
  // Additional checks to prevent email spoofing and other attacks
  if (!isValidFormat) return false;
  
  // Check email length
  if (email.length > 254) return false;
  
  // Check local part length
  const localPart = email.split('@')[0];
  if (localPart.length > 64) return false;
  
  // Check for potentially dangerous characters
  if (/[<>()[\]\\.,;:\s@"]/.test(localPart)) {
    // If quotes are used, make sure they're properly matched
    if (localPart.charAt(0) !== '"' || localPart.charAt(localPart.length - 1) !== '"') {
      return false;
    }
  }
  
  return true;
};

// Enhanced validator for password strength
const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize inputs to prevent XSS - enhanced version
const sanitizeInput = (input) => {
  // More comprehensive sanitization
  if (typeof input === 'string') {
    // Replace HTML tags and other dangerous content
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/`/g, '&#x60;')
      .replace(/\$/g, '&#36;')
      // Prevent script injection through event handlers
      .replace(/on\w+=/gi, 'data-removed=')
      // Remove JavaScript protocol URLs
      .replace(/javascript:/gi, 'removed:')
      // Remove data URIs that could contain scripts
      .replace(/data:(?!image\/)/gi, 'removed:');
  }
  return input;
};

// Enhanced user registration validator
const validateRegistration = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  
  // Check if all required fields are present
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).render('register', { 
      message: 'All fields are required.' 
    });
  }
  
  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).render('register', { 
      message: 'Please enter a valid email address.' 
    });
  }
  
  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).render('register', { 
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' 
    });
  }
  
  // Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).render('register', { 
      message: 'Passwords do not match.' 
    });
  }
  
  // Sanitize inputs before proceeding
  req.body.username = sanitizeInput(username);
  req.body.email = sanitizeInput(email);
  
  next();
};

// Generic input sanitizer middleware
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
};

// Map to track password reset attempts
const resetAttempts = new Map();

// Clear the reset attempts map periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  // Remove entries older than 1 hour
  for (const [key, data] of resetAttempts.entries()) {
    if (now - data.timestamp > 3600000) {
      resetAttempts.delete(key);
    }
  }
}, 600000); // Clean up every 10 minutes

// Rate limiter for password reset attempts
const passwordResetLimiter = (req, res, next) => {
  const clientIP = req.ip;
  const email = req.body.email || '';
  
  // Create keys for tracking
  const ipKey = `ip:${clientIP}`;
  const emailKey = `email:${email.toLowerCase()}`;
  
  const now = Date.now();
  
  // Check IP-based limiting
  if (resetAttempts.has(ipKey)) {
    const ipData = resetAttempts.get(ipKey);
    
    // If locked out, deny request
    if (ipData.lockUntil && ipData.lockUntil > now) {
      const timeLeft = Math.ceil((ipData.lockUntil - now) / 1000 / 60);
      return res.status(429).render('forgot-password', { 
        message: `Too many requests. Please try again in ${timeLeft} minutes.` 
      });
    }
    
    // Update attempts count and check if limit reached
    ipData.attempts += 1;
    ipData.timestamp = now;
    
    // IP is limited to 5 attempts per hour
    if (ipData.attempts >= 5) {
      ipData.lockUntil = now + 3600000; // Lock for 1 hour
      return res.status(429).render('forgot-password', { 
        message: 'Too many requests. Please try again in 60 minutes.' 
      });
    }
    
    resetAttempts.set(ipKey, ipData);
  } else {
    // First attempt from this IP
    resetAttempts.set(ipKey, {
      attempts: 1,
      timestamp: now,
      lockUntil: null
    });
  }
  
  // Also track by email to prevent enumeration attacks
  if (email && resetAttempts.has(emailKey)) {
    const emailData = resetAttempts.get(emailKey);
    emailData.attempts += 1;
    emailData.timestamp = now;
    
    // Email is limited to 3 attempts per hour
    if (emailData.attempts >= 3) {
      emailData.lockUntil = now + 3600000; // Lock for 1 hour
      // Use consistent message to prevent email enumeration
      return res.status(429).render('forgot-password', { 
        message: 'Too many requests. Please try again later.' 
      });
    }
    
    resetAttempts.set(emailKey, emailData);
  } else if (email) {
    // First attempt for this email
    resetAttempts.set(emailKey, {
      attempts: 1,
      timestamp: now,
      lockUntil: null
    });
  }
  
  next();
};

module.exports = {
  validateInput,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateRegistration,
  sanitizeBody,
  passwordResetLimiter
};