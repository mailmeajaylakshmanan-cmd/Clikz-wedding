const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all invoices
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, staffingStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (staffingStatus) query.staffingStatus = staffingStatus;
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }
    const invoices = await secureFind(Invoice, query, req)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await Invoice.countDocuments({ ...query, studioId: req.studioId, isDeleted: false });
    res.json({ invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req).populate('eventCategory').lean();
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create invoice
router.post('/', auth, async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, studioId: req.studioId });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    // Assign fields
    Object.assign(invoice, req.body);
    
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update status only
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await secureFindOne(Invoice, { _id: req.params.id }, req);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    invoice.status = status;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    await Invoice.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
