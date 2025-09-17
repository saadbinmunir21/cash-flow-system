const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const AccountType = require('../models/AccountType');

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('type')
      .sort({ accountId: 1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET owner accounts only
router.get('/owner', async (req, res) => {
  try {
    const accounts = await Account.find({ isOwnerAccount: true })
      .populate('type')
      .sort({ accountId: 1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single account
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate('type');
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new account
router.post('/', async (req, res) => {
  try {
    // If type is provided as name, convert to ObjectId
    if (req.body.type && typeof req.body.type === 'string') {
      const accountType = await AccountType.findOne({ name: req.body.type });
      
      if (!accountType) {
        return res.status(400).json({ message: `Account type "${req.body.type}" not found` });
      }
      
      req.body.type = accountType._id;
    }
    
    const account = new Account(req.body);
    await account.save();
    await account.populate('type');
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    // If type is provided as name, convert to ObjectId
    if (req.body.type && typeof req.body.type === 'string') {
      const accountType = await AccountType.findOne({ name: req.body.type });
      
      if (!accountType) {
        return res.status(400).json({ message: `Account type "${req.body.type}" not found` });
      }
      
      req.body.type = accountType._id;
    }
    
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('type');
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;