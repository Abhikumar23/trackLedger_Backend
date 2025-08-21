const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require("../utils/mailSender");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SEC;

/*
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
*/

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
      .cookie('token', token, {
  httpOnly: true,
  secure: true,       // must be true on HTTPS
  sameSite: 'none',   // allows cross-site cookies
})
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
exports.getProfile = async (req, res) => {

  const { token } = req.cookies;

  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const userData = jwt.verify(token, jwtSecret);
    const userDoc = await User.findById(userData.id);

    if (!userDoc) return res.status(404).json({ error: 'User not found' });

    res.json({
      name: userDoc.name,
      email: userDoc.email,
      _id: userDoc._id,
      profileImage: userDoc.profileImage || null,
    });
  } catch (err) {
    console.error('JWT verify or DB error:', err.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

//LOgout Api

exports.createLogout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,    
    sameSite: 'none',  
    expires: new Date(0),
  }).json({ message: 'Logged out' });
};



cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.uploadImage = async (req, res) => {

  const { token } = req.cookies;

  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    try {
      // Upload file buffer directly to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      // Update user in DB with Cloudinary URL
      const updatedUser = await User.findByIdAndUpdate(
        userData.id,
        { profileImage: result.secure_url },
        { new: true }
      );

      res.json({
        message: "Image uploaded",
        url: result.secure_url,
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.sendRegistrationOtp = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false
    });

    await user.save();

    try {
      await mailSender(
        email,
        "Your Registration OTP",
        `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
      );
    } catch (mailErr) {
      console.error("Mail sending failed:", mailErr.message);
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.json({ success: true, message: "OTP sent to email" });

  } catch (error) {
    console.error("Send registration OTP error:", error);
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



