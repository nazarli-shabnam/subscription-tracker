import Subscription from '../models/subscription.model.js';
import dayjs from 'dayjs';

export const getSubscriptionHealthScore = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to view this subscription');
      error.statusCode = 403;
      throw error;
    }

    let score = 100;
    const factors = [];

    // Factor 1: Status (active = good, cancelled/expired = bad)
    if (subscription.status === 'cancelled') {
      score -= 30;
      factors.push({ name: 'Status', impact: -30, reason: 'Subscription is cancelled' });
    } else if (subscription.status === 'expired') {
      score -= 40;
      factors.push({ name: 'Status', impact: -40, reason: 'Subscription has expired' });
    } else if (subscription.status === 'trial') {
      score -= 10;
      factors.push({ name: 'Status', impact: -10, reason: 'Currently in trial period' });
    }

    // Factor 2: Renewal date proximity (renewing soon = potential issue)
    if (subscription.renewalDate) {
      const renewalDate = dayjs(subscription.renewalDate);
      const now = dayjs();
      const daysUntilRenewal = renewalDate.diff(now, 'day');
      
      if (daysUntilRenewal < 0) {
        score -= 20;
        factors.push({ name: 'Renewal Date', impact: -20, reason: 'Renewal date has passed' });
      } else if (daysUntilRenewal <= 7) {
        score -= 5;
        factors.push({ name: 'Renewal Date', impact: -5, reason: 'Renewal is very soon' });
      }
    }

    // Factor 3: Price (very expensive = potential waste)
    const monthlyMultipliers = {
      daily: 30,
      weekly: 4.33,
      monthly: 1,
      yearly: 1/12
    };
    const monthlyEquivalent = subscription.price * (monthlyMultipliers[subscription.frequency] || 1);
    
    if (monthlyEquivalent > 50) {
      score -= 10;
      factors.push({ name: 'Price', impact: -10, reason: 'High monthly cost' });
    } else if (monthlyEquivalent > 100) {
      score -= 20;
      factors.push({ name: 'Price', impact: -20, reason: 'Very high monthly cost' });
    }

    // Factor 4: Trial expiration (if trial is ending soon)
    if (subscription.isTrial && subscription.trialEndDate) {
      const trialEnd = dayjs(subscription.trialEndDate);
      const now = dayjs();
      const daysUntilTrialEnd = trialEnd.diff(now, 'day');
      
      if (daysUntilTrialEnd < 0) {
        score -= 15;
        factors.push({ name: 'Trial', impact: -15, reason: 'Trial period has ended' });
      } else if (daysUntilTrialEnd <= 3) {
        score -= 5;
        factors.push({ name: 'Trial', impact: -5, reason: 'Trial ending soon' });
      }
    }

    // Factor 5: Has notes/tags (organization = good)
    if (subscription.notes && subscription.notes.length > 0) {
      score += 5;
      factors.push({ name: 'Organization', impact: 5, reason: 'Has notes' });
    }
    if (subscription.tags && subscription.tags.length > 0) {
      score += 5;
      factors.push({ name: 'Organization', impact: 5, reason: 'Has tags' });
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine health status
    let healthStatus = 'excellent';
    let recommendation = 'Subscription looks healthy!';
    
    if (score < 30) {
      healthStatus = 'critical';
      recommendation = 'Consider cancelling this subscription. It appears to be expired, cancelled, or not providing value.';
    } else if (score < 50) {
      healthStatus = 'poor';
      recommendation = 'This subscription may not be providing good value. Review and consider cancelling.';
    } else if (score < 70) {
      healthStatus = 'fair';
      recommendation = 'This subscription could be optimized. Review usage and value.';
    } else if (score < 85) {
      healthStatus = 'good';
      recommendation = 'Subscription is in good shape. Keep monitoring.';
    } else {
      healthStatus = 'excellent';
      recommendation = 'Subscription is healthy and well-managed!';
    }

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          name: subscription.name,
          status: subscription.status
        },
        healthScore: Math.round(score),
        healthStatus,
        recommendation,
        factors,
        monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllHealthScores = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });

    const scores = await Promise.all(
      subscriptions.map(async (sub) => {
        // Simplified score calculation for bulk
        let score = 100;
        if (sub.status === 'cancelled') score -= 30;
        else if (sub.status === 'expired') score -= 40;
        else if (sub.status === 'trial') score -= 10;

        const monthlyMultipliers = {
          daily: 30,
          weekly: 4.33,
          monthly: 1,
          yearly: 1/12
        };
        const monthlyEquivalent = sub.price * (monthlyMultipliers[sub.frequency] || 1);
        if (monthlyEquivalent > 100) score -= 20;
        else if (monthlyEquivalent > 50) score -= 10;

        score = Math.max(0, Math.min(100, score));

        return {
          id: sub._id,
          name: sub.name,
          status: sub.status,
          healthScore: Math.round(score),
          monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100
        };
      })
    );

    // Sort by score (lowest first - most attention needed)
    scores.sort((a, b) => a.healthScore - b.healthScore);

    res.status(200).json({
      success: true,
      data: scores,
      averageScore: scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.healthScore, 0) / scores.length)
        : 0
    });
  } catch (error) {
    next(error);
  }
};

