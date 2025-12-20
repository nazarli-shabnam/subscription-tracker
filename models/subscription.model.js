import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    category: {
      type: String,
      enum: [
        "sports",
        "news",
        "entertainment",
        "lifestyle",
        "technology",
        "finance",
        "politics",
        "other",
      ],
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial"],
      default: "active",
    },
    isTrial: {
      type: Boolean,
      default: false,
    },
    trialStartDate: {
      type: Date,
    },
    trialEndDate: {
      type: Date,
    },
    cancellationDate: {
      type: Date,
    },
    workflowRunId: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate && this.frequency) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    const daysToAdd = renewalPeriods[this.frequency];
    if (daysToAdd === undefined) {
      return next(
        new Error(
          `Invalid frequency: ${this.frequency}. Must be one of: daily, weekly, monthly, yearly`
        )
      );
    }

    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(this.renewalDate.getDate() + daysToAdd);
  }

  if (this.renewalDate && this.renewalDate < new Date()) {
    this.status = "expired";
  }

  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
