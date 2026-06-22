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

    const [totalInvoices, statusCounts, revenueData, todaysAssignments] = await Promise.all([
      Invoice.countDocuments({ studioId: req.studioId, isDeleted: false }),
      Invoice.aggregate([
        { $match: { studioId: req.studioId, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { studioId: req.studioId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalReceived: { $sum: '$advancePaid' }, // We'll add totalPaid below
            totalBalance: { $sum: '$balance' },
            totalDiscount: { $sum: '$discount' },
            sumTotalPaid: { $sum: '$totalPaid' }
          },
        },
      ]),
      Invoice.countDocuments({
        studioId: req.studioId,
        isDeleted: false,
        eventDates: { $gte: todayStart, $lte: todayEnd }
      })
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    const revenue = revenueData[0] || { totalRevenue: 0, totalReceived: 0, totalBalance: 0, totalDiscount: 0, sumTotalPaid: 0 };
    revenue.totalReceived = (revenue.totalReceived || 0) + (revenue.sumTotalPaid || 0);

    // 1. Pipeline Invoices (Recent 15)
    const pipelineInvoices = await secureFind(Invoice, {}, req)
      .sort({ createdAt: -1 })
      .limit(15)
      .select('invoiceNo customer.name eventCategoryName total status eventDates createdAt')
      .lean();

    // 2. Upcoming Schedule (5 events happening today or future)
    const upcomingSchedule = await secureFind(Invoice, { eventDates: { $gte: todayStart } }, req)
      .sort({ 'eventDates': 1 })
      .limit(5)
      .select('customer.name location eventDates staffingStatus requiredStaff staffAllocated eventCategoryName')
      .lean();

    // 3. Recent Transactions (Generate a mock ledger feed from recent invoices that have payments)
    const txInvoices = await secureFind(Invoice, {
      $or: [{ advancePaid: { $gt: 0 } }, { totalPaid: { $gt: 0 } }]
    }).sort({ updatedAt: -1 }).limit(10).lean();

    const recentPayments = [];
    txInvoices.forEach(inv => {
      if (inv.advancePaid > 0) {
        recentPayments.push({
          id: `${inv._id}_adv`,
          type: 'income',
          amount: inv.advancePaid,
          description: `${inv.customer.name} Advance (${inv.advancePaymentMethod})`,
          date: new Date(inv.updatedAt).toLocaleDateString(),
          category: inv.eventCategoryName || 'Service'
        });
      }
      if (inv.totalPaid > 0) {
        recentPayments.push({
          id: `${inv._id}_fin`,
          type: 'income',
          amount: inv.totalPaid,
          description: `${inv.customer.name} Final Payment (${inv.totalPaymentMethod})`,
          date: new Date(inv.updatedAt).toLocaleDateString(),
          category: inv.eventCategoryName || 'Service'
        });
      }
    });

    // Sort by date descending
    recentPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalInvoices,
      statusMap,
      todaysAssignments,
      totalRevenue: revenue.totalRevenue,
      totalReceived: revenue.totalReceived,
      totalBalance: revenue.totalBalance,
      pipelineInvoices,
      upcomingSchedule,
      recentPayments: recentPayments.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
