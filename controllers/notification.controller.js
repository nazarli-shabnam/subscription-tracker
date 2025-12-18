import User from '../models/user.model.js';

export const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        notificationPreferences: user.notificationPreferences || {
          reminderDays: [7, 5, 2, 1],
          emailEnabled: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          noEmailDays: []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { reminderDays, emailEnabled, quietHours, noEmailDays } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        reminderDays: [7, 5, 2, 1],
        emailEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        noEmailDays: []
      };
    }

    if (reminderDays !== undefined) {
      user.notificationPreferences.reminderDays = reminderDays;
    }
    if (emailEnabled !== undefined) {
      user.notificationPreferences.emailEnabled = emailEnabled;
    }
    if (quietHours !== undefined) {
      if (quietHours.enabled !== undefined) {
        user.notificationPreferences.quietHours.enabled = quietHours.enabled;
      }
      if (quietHours.start !== undefined) {
        user.notificationPreferences.quietHours.start = quietHours.start;
      }
      if (quietHours.end !== undefined) {
        user.notificationPreferences.quietHours.end = quietHours.end;
      }
    }
    if (noEmailDays !== undefined) {
      user.notificationPreferences.noEmailDays = noEmailDays;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

