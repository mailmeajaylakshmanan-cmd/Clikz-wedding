const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { secureFind } = require('../utils/queryHelper');

router.get('/', auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const yearStart = new Date(todayStart.getFullYear(), 0, 1);

    // Run aggregations with safe error fallbacks
    let totalInvoices = 0;
    let statusCounts = [];
    let revenueData = [];
    let todaysAssignments = 0;
    let monthlyData = [];

    try {
      const results = await Promise.allSettled([
        Invoice.countDocuments(),
        Invoice.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $ifNull: ['$total', 0] } },
              totalBalance: { $sum: { $ifNull: ['$balance', 0] } },
              totalDiscount: { $sum: { $ifNull: ['$discount', 0] } }
            },
          },
        ]),
        Invoice.countDocuments({
          eventDates: { $gte: todayStart, $lte: todayEnd }
        }),
        Invoice.aggregate([
          { $match: { createdAt: { $type: 'date', $gte: yearStart } } },
          { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
        ])
      ]);

      if (results[0].status === 'fulfilled') totalInvoices = results[0].value;
      if (results[1].status === 'fulfilled') statusCounts = results[1].value;
      if (results[2].status === 'fulfilled') revenueData = results[2].value;
      if (results[3].status === 'fulfilled') todaysAssignments = results[3].value;
      if (results[4].status === 'fulfilled') monthlyData = results[4].value;
    } catch (aggErr) {
      console.error('Aggregation error in dashboard:', aggErr);
    }

    const statusMap = {};
    if (Array.isArray(statusCounts)) {
      statusCounts.forEach(s => {
        if (s && s._id) statusMap[s._id] = s.count || 0;
      });
    }

    const revenue = (revenueData && revenueData[0]) || { totalRevenue: 0, totalBalance: 0, totalDiscount: 0 };
    revenue.totalReceived = (revenue.totalRevenue || 0) - (revenue.totalBalance || 0);

    // 1. Pipeline Invoices (Recent 15)
    let pipelineInvoices = [];
    try {
      pipelineInvoices = await secureFind(Invoice, {})
        .sort({ createdAt: -1 })
        .limit(15)
        .select('invoiceNo customer.name eventCategoryName total status eventDates createdAt')
        .lean();
    } catch (e) {
      console.error('Error fetching pipeline invoices:', e);
    }

    // 2. Schedule (Events for the calendar)
    let upcomingSchedule = [];
    try {
      upcomingSchedule = await secureFind(Invoice, { 
        $or: [
          { 'eventDates.0': { $exists: true } },
          { eventDate: { $exists: true, $ne: '' } }
        ]
      })
        .sort({ 'createdAt': -1 })
        .limit(100)
        .select('customer.name location eventDate eventDates staffingStatus requiredStaff staffAllocated eventCategoryName')
        .lean();
    } catch (e) {
      console.error('Error fetching upcoming schedule:', e);
    }

    // 3. Recent Transactions (From recent invoices that have payments)
    const recentPayments = [];
    try {
      const txInvoices = await secureFind(Invoice, {
        'payments.0': { $exists: true }
      }).sort({ updatedAt: -1 }).limit(10).lean();

      txInvoices.forEach(inv => {
        if (inv.payments && inv.payments.length > 0) {
          inv.payments.forEach((payment, idx) => {
            const rawDate = payment.date || inv.updatedAt || new Date();
            recentPayments.push({
              id: `${inv._id}_pay_${idx}`,
              type: 'income',
              amount: payment.amount || 0,
              description: `${inv.customer?.name || 'Customer'} - ${payment.type || 'Payment'} (${payment.method || 'Cash'})`,
              date: new Date(rawDate).toLocaleDateString('en-IN'),
              rawDate: new Date(rawDate).getTime(),
              category: inv.eventCategoryName || 'Service'
            });
          });
        }
      });

      // Sort by timestamp descending
      recentPayments.sort((a, b) => b.rawDate - a.rawDate);
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueData = months.map((month, idx) => {
      const found = Array.isArray(monthlyData) ? monthlyData.find(m => m._id === idx + 1) : null;
      return { month, revenue: found ? (found.revenue || 0) : 0 };
    });

    res.json({
      totalInvoices,
      statusMap,
      todaysAssignments,
      totalRevenue: revenue.totalRevenue || 0,
      totalReceived: revenue.totalReceived || 0,
      totalBalance: revenue.totalBalance || 0,
      pipelineInvoices,
      upcomingSchedule,
      recentPayments: recentPayments.slice(0, 10),
      monthlyRevenueData,
    });
  } catch (err) {
    console.error('Dashboard route fatal error:', err);
    res.status(500).json({ message: 'Error loading dashboard data', error: err.message });
  }
});

module.exports = router;

