import Subscription from '../models/subscription.model.js';
import dayjs from 'dayjs';

export const exportSubscriptions = async (req, res, next) => {
  try {
    const { format = 'json', status } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter).sort({ renewalDate: 1 });

    if (format === 'csv') {
      const headers = [
        'Name',
        'Price',
        'Currency',
        'Frequency',
        'Category',
        'Status',
        'Payment Method',
        'Start Date',
        'Renewal Date',
        'Cancellation Date',
        'Tags',
        'Notes',
        'Created At'
      ];

      const rows = subscriptions.map(sub => [
        sub.name || '',
        sub.price || 0,
        sub.currency || 'USD',
        sub.frequency || '',
        sub.category || '',
        sub.status || 'active',
        sub.paymentMethod || '',
        sub.startDate ? dayjs(sub.startDate).format('YYYY-MM-DD') : '',
        sub.renewalDate ? dayjs(sub.renewalDate).format('YYYY-MM-DD') : '',
        sub.cancellationDate ? dayjs(sub.cancellationDate).format('YYYY-MM-DD') : '',
        (sub.tags || []).join('; '),
        (sub.notes || '').replace(/\n/g, ' ').replace(/,/g, ';'),
        sub.createdAt ? dayjs(sub.createdAt).format('YYYY-MM-DD HH:mm:ss') : ''
      ]);

      // Escape CSV values
      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=subscriptions-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.status(200).send(csvContent);
    } else {
      // JSON format
      const data = subscriptions.map(sub => ({
        id: sub._id,
        name: sub.name,
        price: sub.price,
        currency: sub.currency,
        frequency: sub.frequency,
        category: sub.category,
        status: sub.status,
        paymentMethod: sub.paymentMethod,
        startDate: sub.startDate ? dayjs(sub.startDate).toISOString() : null,
        renewalDate: sub.renewalDate ? dayjs(sub.renewalDate).toISOString() : null,
        cancellationDate: sub.cancellationDate ? dayjs(sub.cancellationDate).toISOString() : null,
        tags: sub.tags || [],
        notes: sub.notes || '',
        createdAt: sub.createdAt ? dayjs(sub.createdAt).toISOString() : null,
        updatedAt: sub.updatedAt ? dayjs(sub.updatedAt).toISOString() : null
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=subscriptions-${dayjs().format('YYYY-MM-DD')}.json`);
      res.status(200).json({
        success: true,
        exportedAt: dayjs().toISOString(),
        count: data.length,
        data
      });
    }
  } catch (error) {
    next(error);
  }
};

