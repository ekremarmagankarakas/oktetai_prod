const authenticateUser = (req, res, next) => {
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/terms-conditions",
    "/privacy-policy",
    "/auth/google",
    "/auth/google/callback",
    "/forgot-password",
    "/reset-password/:token",
  ];

  if (
    publicRoutes.includes(req.path) ||
    req.path.startsWith("/reset-password/")
  ) {
    return next();
  }
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

module.exports = { authenticateUser };

