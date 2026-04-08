const express = require('express');
const router = express.Router();
const {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary
} = require('../controllers/transactionController');

// POST /transactions - Add income/expense
router.post('/', addTransaction);

// GET /transactions - Fetch all transactions
router.get('/', getAllTransactions);

// GET /transactions/:id - View single transaction
router.get('/:id', getTransactionById);

// PUT /transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

// GET /summary - Fetch income-expense summary
router.get('/summary/all', getSummary);

module.exports = router;