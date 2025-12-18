import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  monthlyBudget: {
    type: Number,
    min: [0, 'Monthly budget must be greater than or equal to 0'],
  },
  yearlyBudget: {
    type: Number,
    min: [0, 'Yearly budget must be greater than or equal to 0'],
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  budgetByCategory: {
    type: Map,
    of: Number,
    default: {}
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;

