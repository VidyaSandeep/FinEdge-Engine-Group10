const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// Add new transaction
const addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, description } = req.body;

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const transaction = new Transaction({
      user: userId,
      type,
      category,
      amount,
      date: date || new Date(),
      description
    });

    await transaction.save();

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all transactions for a user
const getAllTransactions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const transactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single transaction
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('user', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove user field if present (shouldn't be updated this way)
    delete updates.user;

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get income-expense summary
const getSummary = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Aggregate transactions for current month
    const summary = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $expr: {
            $and: [
              { $eq: [{ $month: '$date' }, currentMonth] },
              { $eq: [{ $year: '$date' }, currentYear] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const income = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
    const expense = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };

    res.status(200).json({
      period: `${currentMonth}/${currentYear}`,
      income: {
        total: income.total,
        count: income.count
      },
      expense: {
        total: expense.total,
        count: expense.count
      },
      balance: income.total - expense.total
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary
};