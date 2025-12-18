import PriceHistory from '../models/priceHistory.model.js';
import Subscription from '../models/subscription.model.js';

export const getPriceHistory = async (req, res, next) => {
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

    const priceHistory = await PriceHistory.find({ subscription: req.params.id })
      .sort({ changedAt: -1 })
      .limit(50); // Limit to last 50 changes

    // Calculate statistics
    const stats = {
      totalChanges: priceHistory.length,
      increases: priceHistory.filter(h => h.changeType === 'increase').length,
      decreases: priceHistory.filter(h => h.changeType === 'decrease').length,
      currentPrice: subscription.price,
      firstPrice: priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : subscription.price,
      totalChange: priceHistory.length > 0 
        ? subscription.price - priceHistory[priceHistory.length - 1].price 
        : 0,
      percentageChange: priceHistory.length > 0
        ? ((subscription.price - priceHistory[priceHistory.length - 1].price) / priceHistory[priceHistory.length - 1].price) * 100
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          name: subscription.name,
          currentPrice: subscription.price,
          currency: subscription.currency
        },
        history: priceHistory,
        statistics: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to track price changes (call this when updating subscription price)
export const trackPriceChange = async (subscriptionId, newPrice, currency, previousPrice) => {
  try {
    if (previousPrice === undefined || previousPrice === null) {
      // Initial price entry
      await PriceHistory.create({
        subscription: subscriptionId,
        price: newPrice,
        currency: currency,
        changeType: 'initial'
      });
    } else if (previousPrice !== newPrice) {
      // Price changed
      const changeType = newPrice > previousPrice ? 'increase' : 'decrease';
      const percentageChange = ((newPrice - previousPrice) / previousPrice) * 100;

      await PriceHistory.create({
        subscription: subscriptionId,
        price: newPrice,
        currency: currency,
        changeType: changeType,
        previousPrice: previousPrice,
        percentageChange: Math.round(percentageChange * 100) / 100
      });
    }
  } catch (error) {
    console.error('Error tracking price change:', error);
    // Don't throw - price tracking shouldn't break subscription updates
  }
};

