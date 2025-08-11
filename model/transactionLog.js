const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATED', 'UPDATED', 'DELETED']
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now, // ✅ FIXED
  }
});

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);
module.exports = TransactionLog;
