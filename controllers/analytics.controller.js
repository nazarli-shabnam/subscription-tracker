import Subscription from '../models/subscription.model.js';
import Budget from '../models/budget.model.js';
import dayjs from 'dayjs';
export const getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || 'monthly';

    const subscriptions = await Subscription.find({ user: userId });

    const calculateTotalSpending = (subs, periodType) => {
      return subs.reduce((total, sub) => {
        if (sub.status !== 'active') return total;
        
        let multiplier = 1;
        if (periodType === 'yearly') {
          const multipliers = {
            daily: 365,
            weekly: 52,
            monthly: 12,
            yearly: 1
          };
          multiplier = multipliers[sub.frequency] || 1;
        } else {
          const multipliers = {
            daily: 30,
            weekly: 4.33,
            monthly: 1,
            yearly: 1/12
          };
          multiplier = multipliers[sub.frequency] || 1;
        }
        
        return total + (sub.price * multiplier);
      }, 0);
    };

    const spendingByCategory = {};
    const categoryCounts = {};
    
    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        const category = sub.category || 'other';
        if (!spendingByCategory[category]) {
          spendingByCategory[category] = 0;
          categoryCounts[category] = 0;
        }
        
        let multiplier = 1;
        if (period === 'yearly') {
          const multipliers = {
            daily: 365,
            weekly: 52,
            monthly: 12,
            yearly: 1
          };
          multiplier = multipliers[sub.frequency] || 1;
        } else {
          const multipliers = {
            daily: 30,
            weekly: 4.33,
            monthly: 1,
            yearly: 1/12
          };
          multiplier = multipliers[sub.frequency] || 1;
        }
        
        spendingByCategory[category] += sub.price * multiplier;
        categoryCounts[category] += 1;
      }
    });

    const spendingByCurrency = {};
    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        const currency = sub.currency || 'USD';
        if (!spendingByCurrency[currency]) {
          spendingByCurrency[currency] = 0;
        }
        
        let multiplier = 1;
        if (period === 'yearly') {
          const multipliers = {
            daily: 365,
            weekly: 52,
            monthly: 12,
            yearly: 1
          };
          multiplier = multipliers[sub.frequency] || 1;
        } else {
          const multipliers = {
            daily: 30,
            weekly: 4.33,
            monthly: 1,
            yearly: 1/12
          };
          multiplier = multipliers[sub.frequency] || 1;
        }
        
        spendingByCurrency[currency] += sub.price * multiplier;
      }
    });

    const statusCounts = {
      active: 0,
      cancelled: 0,
      expired: 0
    };
    subscriptions.forEach(sub => {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    });

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const averageCost = activeSubscriptions.length > 0
      ? activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0) / activeSubscriptions.length
      : 0;

    const mostExpensive = subscriptions
      .filter(sub => sub.status === 'active')
      .sort((a, b) => {
        const getMonthlyEquivalent = (sub) => {
          const multipliers = {
            daily: 30,
            weekly: 4.33,
            monthly: 1,
            yearly: 1/12
          };
          return sub.price * (multipliers[sub.frequency] || 1);
        };
        return getMonthlyEquivalent(b) - getMonthlyEquivalent(a);
      })
      .slice(0, 5)
      .map(sub => ({
        id: sub._id,
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        frequency: sub.frequency,
        monthlyEquivalent: (() => {
          const multipliers = {
            daily: 30,
            weekly: 4.33,
            monthly: 1,
            yearly: 1/12
          };
          return sub.price * (multipliers[sub.frequency] || 1);
        })()
      }));

    const totalSpending = calculateTotalSpending(subscriptions, period);

    const upcomingRenewals = subscriptions.filter(sub => {
      if (sub.status !== 'active' || !sub.renewalDate) return false;
      const renewalDate = dayjs(sub.renewalDate);
      const now = dayjs();
      const daysUntil = renewalDate.diff(now, 'day');
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;

    const budget = await Budget.findOne({ user: userId });
    let budgetStatus = null;
    
    if (budget) {
      const budgetAmount = period === 'yearly' ? budget.yearlyBudget : budget.monthlyBudget;
      if (budgetAmount > 0) {
        const percentage = (totalSpending / budgetAmount) * 100;
        let status = 'under';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= budget.alertThreshold) status = 'warning';
        
        budgetStatus = {
          budget: budgetAmount,
          spending: totalSpending,
          percentage: Math.round(percentage * 100) / 100,
          status,
          remaining: Math.max(0, budgetAmount - totalSpending),
          overBudget: Math.max(0, totalSpending - budgetAmount),
          alertThreshold: budget.alertThreshold
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        period,
        totalSpending: Math.round(totalSpending * 100) / 100,
        averageCost: Math.round(averageCost * 100) / 100,
        statusCounts,
        spendingByCategory: Object.entries(spendingByCategory).map(([category, amount]) => ({
          category,
          amount: Math.round(amount * 100) / 100,
          count: categoryCounts[category]
        })),
        spendingByCurrency: Object.entries(spendingByCurrency).map(([currency, amount]) => ({
          currency,
          amount: Math.round(amount * 100) / 100
        })),
        mostExpensive,
        upcomingRenewals,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: statusCounts.active,
        budget: budgetStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

