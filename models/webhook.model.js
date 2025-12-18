import mongoose from 'mongoose';
import crypto from 'crypto';

const webhookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => {
        try {
          new URL(value);
          return value.startsWith('http://') || value.startsWith('https://');
        } catch {
          return false;
        }
      },
      message: 'URL must be a valid HTTP or HTTPS URL'
    }
  },
  secret: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  events: {
    type: [String],
    required: true,
    enum: [
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'subscription.deleted',
      'subscription.renewal_reminder',
      'subscription.trial_ending',
      'budget.exceeded',
      'budget.warning'
    ],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTriggered: {
    type: Date,
  },
  failureCount: {
    type: Number,
    default: 0
  },
  maxFailures: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

// Index for efficient queries
webhookSchema.index({ user: 1, isActive: 1 });
webhookSchema.index({ events: 1 });

const Webhook = mongoose.model('Webhook', webhookSchema);

export default Webhook;

