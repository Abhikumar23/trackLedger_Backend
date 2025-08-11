const express = require("express");
const router = express.Router();
const {
  createTransaction, getTransaction, deleteTransaction,
  putTransaction, monthlySummery, findTransaction
} = require("../controllers/transactions");

const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);  // 🔐 Protect all transaction routes

router.post('/', createTransaction);
router.get('/', getTransaction);
router.put('/:id', putTransaction);
router.delete('/:id', deleteTransaction);
router.get('/monthly-summary', monthlySummery);
router.get('/:id', findTransaction);

module.exports = router;
