const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require("../utils/mailSender");
require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SEC;

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create JWT token and set cookie
    jwt.sign({ email: newUser.email, id: newUser._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;

      res
        .cookie('token', token, { httpOnly: true })
        .json({
          status: 'registered and logged in',
          user: {
            name: newUser.name,
            email: newUser.email,
            _id: newUser._id,
            profileImage: newUser.profileImage || null
          }
        });
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(400).json({ message: 'User registration failed' });
  }
};

// ✅ Login existing user
exports.createLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      return res.status(404).json({ status: 'not found' });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) {
      return res.status(422).json({ status: 'password not ok' });
    }

  if (!userDoc.isVerified) {
  return res.status(403).json({ message: 'Please verify your email before logging in.' });
}

    jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;

      res
        .cookie('token', token, { httpOnly: true })
        .json({
          status: 'pass ok',
          user: {
            name: userDoc.name,
            email: userDoc.email,
            _id: userDoc._id,
            profileImage: userDoc.profileImage || null
          }
        });
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

// ✅ Get current logged-in user profile
exports.getProfile = (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, jwtSecret, async (err, userData) => {
    if (err) {
      console.error("JWT verify error:", err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }

    try {
      const userDoc = await User.findById(userData.id);
      if (!userDoc) return res.status(404).json({ error: 'User not found' });

      res.json({
        name: userDoc.name,
        email: userDoc.email,
        _id: userDoc._id,
        profileImage: userDoc.profileImage || null
      });
    } catch (dbErr) {
      console.error("Database error:", dbErr.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// ✅ Logout current user
exports.createLogout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true only in production with HTTPS
    expires: new Date(0),
  }).json({ message: 'Logged out' });
};

exports.uploadImage = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    const updatedUser = await User.findByIdAndUpdate(
      userData.id,
      { profileImage: req.file.filename },
      { new: true }
    );

    res.json({
      message: "Image uploaded",
      filename: req.file.filename,
      url: `http://localhost:4000/uploads/${req.file.filename}`,
      user: updatedUser,
    });
  });
};

exports.sendRegistrationOtp = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    // Temporarily store in user document (optional: use a separate PendingUser model)
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, password: hashedPassword });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await mailSender(
      email,
      "Your Registration OTP",
      `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Send registration OTP error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifyOtpAndRegister = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;

    await user.save();

    // Auto login after OTP verification
    jwt.sign({ email: user.email, id: user._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;

      res.cookie('token', token, { httpOnly: true }).json({
        status: 'registered and logged in',
        user: {
          name: user.name,
          email: user.email,
          _id: user._id,
          profileImage: user.profileImage || null
        }
      });
    });

  } catch (err) {
    console.error("OTP verification failed:", err.message);
    res.status(500).json({ message: "OTP verification failed" });
  }
};



