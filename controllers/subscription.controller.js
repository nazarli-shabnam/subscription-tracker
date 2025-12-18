import Subscription from '../models/subscription.model.js'
import { workflowClient } from '../config/upstash.js'
import { SERVER_URL } from '../config/env.js'
import dayjs from 'dayjs'
import { trackPriceChange } from './priceHistory.controller.js'
import { triggerWebhook } from './webhook.controller.js'

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    let workflowRunId = null;
    try {
      const result = await workflowClient.trigger({
        url: `${SERVER_URL}/api/v1/workflows/subscriptions/reminder`,
        body: {
          subscriptionId: subscription._id.toString(),
        },
        headers: {
          'content-type': 'application/json',
        },
        retries: 0,
      });
      workflowRunId = result?.workflowRunId || null;
      
      // Store workflowRunId in subscription if available
      if (workflowRunId) {
        subscription.workflowRunId = workflowRunId;
        await subscription.save();
      }
    } catch (workflowError) {
      // Log error but don't fail subscription creation
      console.error('Failed to trigger workflow:', workflowError);
    }

    // Trigger webhook if configured
    await triggerWebhook(req.user._id, 'subscription.created', {
      subscriptionId: subscription._id,
      name: subscription.name,
      price: subscription.price
    });

    res.status(201).json({ success: true, data: { subscription, workflowRunId } });
  } catch (e) {
    next(e);
  }
}

export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to view this subscription');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
}

export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to update this subscription');
      error.statusCode = 403;
      throw error;
    }

    // Store old values to check if they changed
    const oldFrequency = subscription.frequency;
    const oldStartDate = subscription.startDate;
    const oldPrice = subscription.price;
    const oldCurrency = subscription.currency;

    // Update fields
    const allowedUpdates = ['name', 'price', 'currency', 'frequency', 'category', 'paymentMethod', 'startDate', 'renewalDate', 'notes', 'tags', 'isTrial', 'trialStartDate', 'trialEndDate'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        subscription[field] = req.body[field];
      }
    });

    // Track price changes
    if (req.body.price !== undefined && (req.body.price !== oldPrice || req.body.currency !== oldCurrency)) {
      await trackPriceChange(
        subscription._id,
        subscription.price,
        subscription.currency,
        oldPrice
      );
    }

    // If frequency or startDate changed, recalculate renewal date
    if ((subscription.frequency !== oldFrequency || subscription.startDate.getTime() !== oldStartDate.getTime()) && subscription.frequency) {
      const renewalPeriods = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365,
      };
      const daysToAdd = renewalPeriods[subscription.frequency];
      if (daysToAdd) {
        subscription.renewalDate = new Date(subscription.startDate);
        subscription.renewalDate.setDate(subscription.renewalDate.getDate() + daysToAdd);
      }
    }

    // If status changed to cancelled, set cancellation date
    if (req.body.status === 'cancelled' && subscription.status !== 'cancelled') {
      subscription.cancellationDate = new Date();
    } else if (req.body.status === 'active' && subscription.status === 'cancelled') {
      // Reactivating - clear cancellation date
      subscription.cancellationDate = undefined;
    }

    await subscription.save();

    // Trigger webhook if configured
    await triggerWebhook(req.user._id, 'subscription.updated', {
      subscriptionId: subscription._id,
      name: subscription.name,
      price: subscription.price,
      status: subscription.status
    });

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
}

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to delete this subscription');
      error.statusCode = 403;
      throw error;
    }

    // Trigger webhook before deletion
    await triggerWebhook(req.user._id, 'subscription.deleted', {
      subscriptionId: subscription._id,
      name: subscription.name
    });

    // Hard delete - remove from database
    // Note: Workflow will automatically stop when it checks subscription status
    await Subscription.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Subscription deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
}

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to cancel this subscription');
      error.statusCode = 403;
      throw error;
    }

    // Check if already cancelled
    if (subscription.status === 'cancelled') {
      return res.status(200).json({ 
        success: true, 
        message: 'Subscription is already cancelled',
        data: subscription 
      });
    }

    // Cancel subscription
    subscription.status = 'cancelled';
    subscription.cancellationDate = new Date();
    await subscription.save();

    // Trigger webhook if configured
    await triggerWebhook(req.user._id, 'subscription.cancelled', {
      subscriptionId: subscription._id,
      name: subscription.name,
      cancellationDate: subscription.cancellationDate
    });

    // Note: Workflow will automatically stop sending reminders when it checks status !== 'active'

    res.status(200).json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      data: subscription 
    });
  } catch (error) {
    next(error);
  }
}

export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default to 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptions = await Subscription.find({
      user: req.user._id,
      status: 'active',
      renewalDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ renewalDate: 1 });

    // Add countdown days to each subscription
    const subscriptionsWithCountdown = subscriptions.map(sub => {
      const renewalDate = dayjs(sub.renewalDate);
      const now = dayjs();
      const daysUntilRenewal = renewalDate.diff(now, 'day');
      
      return {
        ...sub.toObject(),
        daysUntilRenewal
      };
    });

    res.status(200).json({ 
      success: true, 
      data: subscriptionsWithCountdown,
      count: subscriptionsWithCountdown.length,
      daysRange: days
    });
  } catch (error) {
    next(error);
  }
}

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const {
      status,
      category,
      frequency,
      currency,
      search,
      tags,
      sortBy = 'renewalDate',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (frequency) filter.frequency = frequency;
    if (currency) filter.currency = currency;

    // Filter by tags (can be comma-separated or array)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }

    // Search by name or notes
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const subscriptions = await Subscription.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Subscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

export const getUserSubscriptions = async (req, res, next) => {
  try {
    // Check if the user is the same as the one in the token
    if(req.user._id.toString() !== req.params.id) {
      const error = new Error('You are not the owner of this account');
      error.statusCode = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
}