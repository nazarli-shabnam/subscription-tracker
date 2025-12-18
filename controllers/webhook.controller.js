import Webhook from '../models/webhook.model.js';
import crypto from 'crypto';

export const createWebhook = async (req, res, next) => {
  try {
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      const error = new Error('URL and events array are required');
      error.statusCode = 400;
      throw error;
    }

    const webhook = await Webhook.create({
      user: req.user._id,
      url,
      events,
      secret: crypto.randomBytes(32).toString('hex')
    });

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: {
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        secret: webhook.secret // Only shown once on creation
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhooks = async (req, res, next) => {
  try {
    const webhooks = await Webhook.find({ user: req.user._id }).select('-secret');

    res.status(200).json({
      success: true,
      data: webhooks
    });
  } catch (error) {
    next(error);
  }
};

export const getWebhookById = async (req, res, next) => {
  try {
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      const error = new Error('Webhook not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (webhook.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to view this webhook');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: webhook
    });
  } catch (error) {
    next(error);
  }
};

export const updateWebhook = async (req, res, next) => {
  try {
    const { url, events, isActive } = req.body;

    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      const error = new Error('Webhook not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (webhook.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to update this webhook');
      error.statusCode = 403;
      throw error;
    }

    if (url !== undefined) webhook.url = url;
    if (events !== undefined) webhook.events = events;
    if (isActive !== undefined) webhook.isActive = isActive;

    await webhook.save();

    res.status(200).json({
      success: true,
      message: 'Webhook updated successfully',
      data: webhook
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (req, res, next) => {
  try {
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      const error = new Error('Webhook not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (webhook.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to delete this webhook');
      error.statusCode = 403;
      throw error;
    }

    await Webhook.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to trigger webhooks (called from other controllers)
export const triggerWebhook = async (userId, event, payload) => {
  try {
    const webhooks = await Webhook.find({
      user: userId,
      isActive: true,
      events: event
    });

    for (const webhook of webhooks) {
      try {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Webhook-Id': webhook._id.toString()
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload
          })
        });

        if (response.ok) {
          webhook.lastTriggered = new Date();
          webhook.failureCount = 0;
        } else {
          webhook.failureCount += 1;
          if (webhook.failureCount >= webhook.maxFailures) {
            webhook.isActive = false;
          }
        }

        await webhook.save();
      } catch (error) {
        console.error(`Webhook ${webhook._id} failed:`, error);
        webhook.failureCount += 1;
        if (webhook.failureCount >= webhook.maxFailures) {
          webhook.isActive = false;
        }
        await webhook.save();
      }
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    // Don't throw - webhook failures shouldn't break main functionality
  }
};

