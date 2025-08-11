const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getExpense, createExpense, deleteExpense, updateExpense,
        
 } = require('../controllers/expense');

// Protect all routes
router.use(requireAuth);

// Routes
router.get('/', getExpense);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);
router.put('/:id', updateExpense);


module.exports = router;
