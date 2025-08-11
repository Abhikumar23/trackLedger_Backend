const express = require("express");
const router = express.Router();
const {
  createTransactionLog,
  updateTransactionLog,
  deleteTransactionLog,
  getTransactionLog,
  getAllTransactionLogs
} = require("../controllers/transactionLog");

// const requireAuth = require('../middleware/requireAuth');

// router.use(requireAuth);

// Just define the relative paths here
router.post("/", createTransactionLog);
router.put("/:id", updateTransactionLog);
router.delete("/:id", deleteTransactionLog);
router.get("/:id", getTransactionLog); // if you want logs per transaction
router.get("/", getAllTransactionLogs)

module.exports = router;
