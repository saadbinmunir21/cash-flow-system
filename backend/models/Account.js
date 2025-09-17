const mongoose = require('mongoose');
const Counter = require('./Counter');

const accountSchema = new mongoose.Schema({
  accountId: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountType',
    required: true
  },
  accountNo: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  isOwnerAccount: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-increment middleware
accountSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'account_id',
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.accountId = counter.sequence_value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);