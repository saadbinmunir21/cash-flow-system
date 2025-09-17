const express = require('express');
const router = express.Router();
const AccountType = require('../models/AccountType');

// GET all account types
router.get('/', async (req, res) => {
  try {
    const accountTypes = await AccountType.find().sort({ name: 1 });
    res.json(accountTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new account type
router.post('/', async (req, res) => {
  try {
    const accountType = new AccountType(req.body);
    await accountType.save();
    res.status(201).json(accountType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update account type
router.put('/:id', async (req, res) => {
  try {
    const accountType = await AccountType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!accountType) {
      return res.status(404).json({ message: 'Account type not found' });
    }
    
    res.json(accountType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE account type
router.delete('/:id', async (req, res) => {
  try {
    const accountType = await AccountType.findByIdAndDelete(req.params.id);
    if (!accountType) {
      return res.status(404).json({ message: 'Account type not found' });
    }
    res.json({ message: 'Account type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;