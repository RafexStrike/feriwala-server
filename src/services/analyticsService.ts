import { OrderModel } from '../models/Order';

const completedOrderMatch = { status: 'completed' as const };

export const buildAnalyticsSummary = async (): Promise<{
  totals: { revenue: number; profit: number; sales: number };
  last30Days: Array<{ date: string; revenue: number; profit: number; sales: number }>;
  monthly: Array<{ month: string; revenue: number; profit: number; sales: number }>;
  yearly: Array<{ year: string; revenue: number; profit: number; sales: number }>;
}> => {
  const [totals] = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    }
  ]);

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const last30DaysRaw = await OrderModel.aggregate([
    { $match: { ...completedOrderMatch, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthlyRaw = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const yearlyRaw = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    totals: {
      revenue: totals?.revenue ?? 0,
      profit: totals?.profit ?? 0,
      sales: totals?.sales ?? 0
    },
    last30Days: last30DaysRaw.map((entry) => ({
      date: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    })),
    monthly: monthlyRaw.map((entry) => ({
      month: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    })),
    yearly: yearlyRaw.map((entry) => ({
      year: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    }))
  };
};

