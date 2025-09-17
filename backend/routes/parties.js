const express = require('express');
const router = express.Router();
const Party = require('../models/Party');

// GET all parties
router.get('/', async (req, res) => {
  try {
    const parties = await Party.find().sort({ name: 1 });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single party
router.get('/:id', async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }
    res.json(party);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new party
router.post('/', async (req, res) => {
  try {
    const party = new Party(req.body);
    await party.save();
    res.status(201).json(party);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update party
router.put('/:id', async (req, res) => {
  try {
    const party = await Party.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }
    
    res.json(party);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE party
router.delete('/:id', async (req, res) => {
  try {
    const party = await Party.findByIdAndDelete(req.params.id);
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }
    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;