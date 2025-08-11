const jwt = require('jsonwebtoken');
const User = require('../model/User');
require('dotenv').config();

const jwtSecret = process.env.JWT_SEC;

module.exports = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user; // 💡 This is where user._id becomes accessible
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
