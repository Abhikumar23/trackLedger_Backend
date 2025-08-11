const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  resetPassword,

} = require("../controllers/resetPassword");



router.post("/send-otp", sendOtp);           
router.post("/verify-otp", verifyOtp);      
router.post("/reset-password", resetPassword); 



module.exports = router;
