const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    employeeCode: user.employeeCode,
    designation: user.designation,
    office: user.office,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
  };
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("नाम आवश्यक है।").isLength({ min: 2 }).withMessage("नाम कम से कम 2 अक्षर का होना चाहिए।"),
    body("employeeCode")
      .trim()
      .notEmpty()
      .withMessage("इम्प्लोयी कोड आवश्यक है।")
      .matches(/^\d{6}$/)
      .withMessage("इम्प्लोयी कोड 6 अंकों का होना चाहिए।"),
    body("office").trim().notEmpty().withMessage("कार्यालय आवश्यक है।"),
    body("email").trim().isEmail().withMessage("मान्य ईमेल आवश्यक है।").normalizeEmail(),
    body("mobile")
      .optional({ checkFalsy: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage("मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।"),
    body("password").isLength({ min: 6 }).withMessage("पासवर्ड कम से कम 6 अक्षर का होना चाहिए।"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { name, employeeCode, designation, office, email, mobile, password } = req.body;

      const existing = await User.findOne({ $or: [{ email }, { employeeCode }] });
      if (existing) {
        return res.status(409).json({ message: "इस ईमेल या इम्प्लोयी कोड से पहले से खाता मौजूद है।" });
      }

      const user = await User.create({
        name,
        employeeCode,
        designation,
        office,
        email,
        mobile,
        password,
      });

      const token = signToken(user);
      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
      res.status(500).json({ message: "Registration failed", error: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("employeeCode").trim().matches(/^\d{6}$/).withMessage("इम्प्लोयी कोड 6 अंकों का होना चाहिए।"),
    body("password").notEmpty().withMessage("पासवर्ड आवश्यक है।"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { employeeCode, password } = req.body;
      const user = await User.findOne({ employeeCode: employeeCode.trim() }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid employee code or password" });
      }
      const token = signToken(user);
      res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
      res.status(500).json({ message: "Login failed", error: err.message });
    }
  }
);

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
