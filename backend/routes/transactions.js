const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, accountId, startDate, endDate } = req.query;
    
    let filter = {};
    
    // Filter by account
    if (accountId) {
      filter['details.account'] = accountId;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(filter)
      .populate('details.account')
      .sort({ transactionId: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new transaction
router.post('/', async (req, res) => {
  try {
    const { date, details } = req.body;
    
    // Validate that debits equal credits
    const totalDebits = details
      .filter(d => d.type === 'debit')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalCredits = details
      .filter(d => d.type === 'credit')
      .reduce((sum, d) => sum + d.amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ 
        message: 'Total debits must equal total credits',
        totalDebits,
        totalCredits 
      });
    }
    
    // Convert account names to IDs if provided as names
    for (let detail of details) {
      if (typeof detail.account === 'string' && !detail.account.match(/^[0-9a-fA-F]{24}$/)) {
        const account = await Account.findOne({ name: detail.account });
        if (!account) {
          return res.status(400).json({ message: `Account "${detail.account}" not found` });
        }
        detail.account = account._id;
      }
    }
    
    // Add serial numbers to details
    const detailsWithSerial = details.map((detail, index) => ({
      ...detail,
      serialNo: index + 1
    }));
    
    const transaction = new Transaction({
      date,
      details: detailsWithSerial
    });
    
    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('details.account');
    
    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('details.account');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;