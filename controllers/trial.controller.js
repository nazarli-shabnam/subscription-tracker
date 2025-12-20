import Subscription from '../models/subscription.model.js';
import dayjs from 'dayjs';

export const getTrialSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      user: req.user._id,
      isTrial: true,
      status: { $in: ['active', 'trial'] }
    }).sort({ trialEndDate: 1 });

    const subscriptionsWithCountdown = subscriptions.map(sub => {
      const trialEnd = dayjs(sub.trialEndDate);
      const now = dayjs();
      const daysUntilEnd = trialEnd.diff(now, 'day');
      
      return {
        ...sub.toObject(),
        daysUntilTrialEnd: daysUntilEnd,
        isTrialExpiring: daysUntilEnd <= 3 && daysUntilEnd >= 0
      };
    });

    res.status(200).json({
      success: true,
      data: subscriptionsWithCountdown,
      count: subscriptionsWithCountdown.length
    });
  } catch (error) {
    next(error);
  }
};

export const convertTrialToPaid = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to modify this subscription');
      error.statusCode = 403;
      throw error;
    }

    if (!subscription.isTrial) {
      return res.status(400).json({
        success: false,
        message: 'This subscription is not a trial subscription'
      });
    }

    subscription.isTrial = false;
    subscription.status = 'active';
    subscription.trialEndDate = undefined;
    subscription.trialStartDate = undefined;

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Trial converted to paid subscription successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

