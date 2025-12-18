import Budget from '../models/budget.model.js';
import Subscription from '../models/subscription.model.js';
import dayjs from 'dayjs';

export const getBudget = async (req, res, next) => {
  try {
    let budget = await Budget.findOne({ user: req.user._id });

    if (!budget) {
      budget = await Budget.create({
        user: req.user._id,
        monthlyBudget: 0,
        yearlyBudget: 0,
        currency: 'USD'
      });
    }

    const spending = await calculateCurrentSpending(req.user._id, budget.currency);

    res.status(200).json({
      success: true,
      data: {
        budget: {
          monthlyBudget: budget.monthlyBudget || 0,
          yearlyBudget: budget.yearlyBudget || 0,
          currency: budget.currency,
          budgetByCategory: Object.fromEntries(budget.budgetByCategory || new Map()),
          alertThreshold: budget.alertThreshold,
          notificationsEnabled: budget.notificationsEnabled
        },
        spending: {
          monthly: spending.monthly,
          yearly: spending.yearly,
          byCategory: spending.byCategory
        },
        status: {
          monthly: calculateBudgetStatus(spending.monthly, budget.monthlyBudget, budget.alertThreshold),
          yearly: calculateBudgetStatus(spending.yearly, budget.yearlyBudget, budget.alertThreshold)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const setBudget = async (req, res, next) => {
  try {
    const { monthlyBudget, yearlyBudget, currency, budgetByCategory, alertThreshold, notificationsEnabled } = req.body;

    let budget = await Budget.findOne({ user: req.user._id });

    if (budget) {
      if (monthlyBudget !== undefined) budget.monthlyBudget = monthlyBudget;
      if (yearlyBudget !== undefined) budget.yearlyBudget = yearlyBudget;
      if (currency) budget.currency = currency;
      if (budgetByCategory) {
        budget.budgetByCategory = new Map(Object.entries(budgetByCategory));
      }
      if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
      if (notificationsEnabled !== undefined) budget.notificationsEnabled = notificationsEnabled;
      
      await budget.save();
    } else {
      budget = await Budget.create({
        user: req.user._id,
        monthlyBudget: monthlyBudget || 0,
        yearlyBudget: yearlyBudget || 0,
        currency: currency || 'USD',
        budgetByCategory: budgetByCategory ? new Map(Object.entries(budgetByCategory)) : new Map(),
        alertThreshold: alertThreshold || 80,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true
      });
    }

    const spending = await calculateCurrentSpending(req.user._id, budget.currency);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        budget: {
          monthlyBudget: budget.monthlyBudget,
          yearlyBudget: budget.yearlyBudget,
          currency: budget.currency,
          budgetByCategory: Object.fromEntries(budget.budgetByCategory || new Map()),
          alertThreshold: budget.alertThreshold,
          notificationsEnabled: budget.notificationsEnabled
        },
        spending: {
          monthly: spending.monthly,
          yearly: spending.yearly,
          byCategory: spending.byCategory
        },
        status: {
          monthly: calculateBudgetStatus(spending.monthly, budget.monthlyBudget, budget.alertThreshold),
          yearly: calculateBudgetStatus(spending.yearly, budget.yearlyBudget, budget.alertThreshold)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const calculateCurrentSpending = async (userId, baseCurrency = 'USD') => {
  const subscriptions = await Subscription.find({ 
    user: userId, 
    status: 'active' 
  });

  const monthlyMultipliers = {
    daily: 30,
    weekly: 4.33,
    monthly: 1,
    yearly: 1/12
  };

  const yearlyMultipliers = {
    daily: 365,
    weekly: 52,
    monthly: 12,
    yearly: 1
  };

  let monthlyTotal = 0;
  let yearlyTotal = 0;
  const byCategory = {};

  subscriptions.forEach(sub => {
    const multiplier = monthlyMultipliers[sub.frequency] || 1;
    const yearlyMultiplier = yearlyMultipliers[sub.frequency] || 1;
    
    if (sub.currency === baseCurrency) {
      const monthlyAmount = sub.price * multiplier;
      const yearlyAmount = sub.price * yearlyMultiplier;
      
      monthlyTotal += monthlyAmount;
      yearlyTotal += yearlyAmount;

      const category = sub.category || 'other';
      if (!byCategory[category]) {
        byCategory[category] = { monthly: 0, yearly: 0 };
      }
      byCategory[category].monthly += monthlyAmount;
      byCategory[category].yearly += yearlyAmount;
    }
  });

  return {
    monthly: Math.round(monthlyTotal * 100) / 100,
    yearly: Math.round(yearlyTotal * 100) / 100,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([cat, amounts]) => [
        cat,
        {
          monthly: Math.round(amounts.monthly * 100) / 100,
          yearly: Math.round(amounts.yearly * 100) / 100
        }
      ])
    )
  };
};

const calculateBudgetStatus = (spending, budget, threshold) => {
  if (!budget || budget === 0) {
    return {
      percentage: 0,
      status: 'no-budget',
      message: 'No budget set'
    };
  }

  const percentage = (spending / budget) * 100;
  let status = 'under';
  let message = 'Within budget';

  if (percentage >= 100) {
    status = 'exceeded';
    message = 'Budget exceeded';
  } else if (percentage >= threshold) {
    status = 'warning';
    message = `Approaching budget limit (${Math.round(percentage)}%)`;
  } else if (percentage >= 50) {
    status = 'moderate';
    message = `Moderate spending (${Math.round(percentage)}%)`;
  }

  return {
    percentage: Math.round(percentage * 100) / 100,
    status,
    message,
    remaining: Math.max(0, budget - spending),
    overBudget: Math.max(0, spending - budget)
  };
};

