require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const helmet = require("helmet");
const winston = require("winston");
const flash = require("connect-flash");
const crypto = require("crypto");
const passport = require("./config/passport");
const path = require("path");
const { subscriptionBasedRateLimiter } = require("./middleware/rateLimiter");
const { authenticateUser } = require("./middleware/authMiddleware");

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const dbURI = process.env.DB_URI;
mongoose
  .connect(dbURI)
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

app.use(require("./routes/webhookRoutes"));

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://js.stripe.com",
        (req, res) => `'nonce-${res.locals.nonce}'`,
      ],
      workerSrc: ["'self'", "blob:"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
      ],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"],
    },
  }),
);
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
);
app.use(
  helmet.permittedCrossDomainPolicies({
    policy: "none",
  }),
);
app.use(
  helmet.referrerPolicy({
    policy: "no-referrer",
  }),
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session clearing code has been run once and can be removed
// If you experience session issues again, uncomment this code to clear sessions:
/*
(async () => {
  try {
    const sessionCollection = mongoose.connection.collection('sessions');
    await sessionCollection.deleteMany({});
    console.log('Cleared existing sessions for fresh start');
  } catch (err) {
    console.error('Failed to clear sessions:', err);
  }
})();
*/

// Standard session middleware with enhanced security
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: dbURI,
      stringify: false, // Disable stringifying to avoid JSON parse issues
      autoRemove: 'interval',
      autoRemoveInterval: 60 // Minutes
    }),
    secret: process.env.SESSION_SECRET || 'fallback_secret_for_development',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session with each request
    cookie: {
      httpOnly: true, // Prevent client-side JavaScript from accessing cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // Protect against CSRF attacks
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    },
  }),
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(authenticateUser);
app.use("/api", subscriptionBasedRateLimiter);

// EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Routes
app.use(require("./routes/authRoutes"));
app.use(require("./routes/apiRoutes"));
app.use(require("./routes/conversationRoutes"));
app.use(require("./routes/subscriptionRoutes"));
app.use(require("./routes/resumeRoutes"));
app.use(require("./routes/codeStarterRoutes"));
app.use(require("./routes/essayRoutes"));

app.get("/terms-conditions", (req, res) => {
  res.render("terms-conditions");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/dashboard", async (req, res) => {
  const user = req.user;
  const username = user.username;
  const subscriptionPlan = user.subscriptionPlan;
  const isCustomer = user.customerId ? true : false;

  const apiKeys = user.apiKeys || {};
  const activeApiKeys = Object.keys(apiKeys).filter((key) => apiKeys[key]);

  res.render("index", {
    username,
    subscriptionPlan,
    isCustomer,
    activeApiKeys,
  });
});

app.use((req, res, next) => {
  res.status(404).send("Page Not Found");
});

app.use((err, req, res, next) => {
  logger.error("Global Error Handler:", err);
  res.status(500).send("Something went wrong!");
});
