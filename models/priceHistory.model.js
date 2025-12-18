import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be greater than or equal to 0']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  changeType: {
    type: String,
    enum: ['increase', 'decrease', 'initial'],
    default: 'initial'
  },
  previousPrice: {
    type: Number,
  },
  percentageChange: {
    type: Number,
  },
  notes: {
    type: String,
    trim: true,
    maxLength: 500
  }
}, { timestamps: true });

// Index for efficient queries
priceHistorySchema.index({ subscription: 1, changedAt: -1 });

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

export default PriceHistory;

