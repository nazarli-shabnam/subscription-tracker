import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User Name is required'],
    trim: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    type: String,
    required: [true, 'User Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'User Password is required'],
    minLength: 6,
  },
  notificationPreferences: {
    reminderDays: {
      type: [Number],
      default: [7, 5, 2, 1],
      validate: {
        validator: (arr) => arr.every(day => day >= 0 && day <= 365),
        message: 'Reminder days must be between 0 and 365'
      }
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String,
        default: '22:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm']
      },
      end: {
        type: String,
        default: '08:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm']
      }
    },
    noEmailDays: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every(day => day >= 0 && day <= 6),
        message: 'Day values must be 0-6 (Sunday-Saturday)'
      }
    }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;