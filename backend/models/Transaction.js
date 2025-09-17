const mongoose = require('mongoose');
const Counter = require('./Counter');

// Transaction Detail Schema (your table rows)
const transactionDetailSchema = new mongoose.Schema({
  serialNo: {
    type: Number,
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  }
});

// Main Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: Number,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  details: [transactionDetailSchema], // Array of transaction details
  totalAmount: {
    type: Number  // Removed required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Combined middleware for total amount calculation and auto-increment
transactionSchema.pre('save', async function(next) {
  // Calculate total amount first
  this.totalAmount = this.details.reduce((sum, detail) => sum + detail.amount, 0);
  
  // Then handle auto-increment for new transactions
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'transaction_id',
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.transactionId = counter.sequence_value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);