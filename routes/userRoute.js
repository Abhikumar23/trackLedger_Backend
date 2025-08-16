const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');
const authMiddleware = require('../middleware/requireAuth');

// For file uploads
const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   },
// });

// const upload = multer({ storage });

const upload = multer({ storage: multer.memoryStorage() });

// ----- Public Routes -----
router.post('/register', userController.createUser);
router.post('/login', userController.createLogin);
router.post('/logout', userController.createLogout);

// 🔑 OTP-based registration routes (Add these)
router.post('/send-registration-otp', userController.sendRegistrationOtp);
router.post('/verify-otp-and-register', userController.verifyOtpAndRegister);

// ----- Protected Routes -----
router.get('/profile', authMiddleware, userController.getProfile);
router.post("/upload", authMiddleware, upload.single("profileImage"), userController.uploadImage);

module.exports = router;
