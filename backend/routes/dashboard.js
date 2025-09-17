const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AccountType = require('../models/AccountType');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get counts
    const totalAccounts = await Account.countDocuments();
    const ownerAccounts = await Account.countDocuments({ isOwnerAccount: true });
    const totalTransactions = await Transaction.countDocuments();
    const totalAccountTypes = await AccountType.countDocuments();
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('details.account')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get accounts summary by type
    const accountsByType = await Account.aggregate([
      {
        $lookup: {
          from: 'accounttypes',
          localField: 'type',
          foreignField: '_id',
          as: 'typeInfo'
        }
      },
      {
        $group: {
          _id: '$typeInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      totalAccounts,
      ownerAccounts,
      totalTransactions,
      totalAccountTypes,
      recentTransactions,
      accountsByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET accounts summary
router.get('/accounts-summary', async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('type')
      .select('accountId name type isOwnerAccount')
      .sort({ accountId: 1 });
    
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;