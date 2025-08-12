const express = require("express");
const router = express.Router();
const {
  createTransactionLog,
  updateTransactionLog,
  deleteTransactionLog,
  getTransactionLog,
  getAllTransactionLogs
} = require("../controllers/transactionLog");

// GET all logs for the user
router.get("/", getAllTransactionLogs);

// GET logs for a specific transaction
router.get("/transaction/:transactionId", getTransactionLog);

// These routes would be for individual log operations (if needed)
router.post("/", createTransactionLog);
router.put("/:id", updateTransactionLog);
router.delete("/:id", deleteTransactionLog);

module.exports = router;