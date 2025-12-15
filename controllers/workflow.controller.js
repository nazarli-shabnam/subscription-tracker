import dayjs from 'dayjs'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");
import Subscription from '../models/subscription.model.js';
import { sendReminderEmail } from '../utils/send-email.js'

const REMINDERS = [7, 5, 2, 1]

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  const subscription = await fetchSubscription(context, subscriptionId);

  if(!subscription || subscription.status !== 'active') return;

  const renewalDate = dayjs(subscription.renewalDate);

  if(renewalDate.isBefore(dayjs())) {
    console.log(`Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`);
    return;
  }

  for (const daysBefore of REMINDERS) {
    // Clone the renewalDate to avoid mutation - dayjs subtract mutates the original object
    const reminderDate = dayjs(renewalDate).subtract(daysBefore, 'day');
    const now = dayjs();
    
    // Format label to match email template (singular for 1 day)
    const dayLabel = daysBefore === 1 ? 'day' : 'days';
    const reminderLabel = `${daysBefore} ${dayLabel} before reminder`;

    // Only schedule reminders that are in the future
    if(reminderDate.isAfter(now)) {
      await sleepUntilReminder(context, `Reminder ${daysBefore} ${dayLabel} before`, reminderDate);
      // After sleeping, check if subscription is still active and send reminder
      const updatedSubscription = await fetchSubscription(context, subscriptionId);
      if(updatedSubscription && updatedSubscription.status === 'active') {
        await triggerReminder(context, reminderLabel, updatedSubscription);
      }
    } else if (reminderDate.isSame(now, 'day') || reminderDate.isBefore(now)) {
      // If reminder date is today or in the past, send immediately
      await triggerReminder(context, reminderLabel, subscription);
    }
  }
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run('get subscription', async () => {
    return Subscription.findById(subscriptionId).populate('user', 'name email');
  })
}

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder at ${date}`);
  await context.sleepUntil(label, date.toDate());
}

const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(`Triggering ${label} reminder`);

    await sendReminderEmail({
      to: subscription.user.email,
      type: label,
      subscription,
    })
  })
}