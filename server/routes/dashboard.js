const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [totalInvoices, statusCounts, revenueData] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalReceived: { $sum: '$advancePaid' },
            totalBalance: { $sum: '$balance' },
            totalDiscount: { $sum: '$discount' },
          },
        },
      ]),
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    const revenue = revenueData[0] || { totalRevenue: 0, totalReceived: 0, totalBalance: 0, totalDiscount: 0 };

    // Recent invoices
    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNo customer.name total status balance createdAt');

    res.json({
      totalInvoices,
      statusMap,
      ...revenue,
      recentInvoices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
