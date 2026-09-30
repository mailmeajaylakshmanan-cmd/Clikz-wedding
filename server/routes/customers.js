const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all customers (with search for autocomplete)
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let customers;

    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      try {
        // High-performance Atlas Search (if index exists)
        customers = await Customer.aggregate([
          {
            $search: {
              index: "default",
              text: {
                query: trimmedSearch,
                path: ["name", "phone"]
              }
            }
          },
          { $limit: 100 },
          { $sort: { name: 1 } }
        ]);
      } catch (atlasErr) {
        // Safe regex fallback for local or non-Atlas DB
        const reg = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        customers = await secureFind(Customer, {
          $or: [{ name: reg }, { phone: reg }, { address: reg }]
        }).sort({ name: 1 }).limit(100).lean();
      }
    } else {
      customers = await secureFind(Customer, {}).sort({ name: 1 }).lean();
    }

    // Dynamically calculate bookings based on invoices
    const Invoice = require('../models/Invoice');
    const phones = customers.map(c => c.phone).filter(Boolean);
    
    let countMap = {};
    if (phones.length > 0) {
      try {
        const invoiceCounts = await Invoice.aggregate([
          { $match: { 'customer.phone': { $in: phones } } },
          { $group: { _id: '$customer.phone', count: { $sum: 1 } } }
        ]);
        invoiceCounts.forEach(item => {
          countMap[item._id] = item.count;
        });
      } catch (e) {
        console.error('Error counting customer invoices:', e);
      }
    }

    customers = customers.map(c => ({
      ...c,
      totalInvoices: countMap[c.phone] || 0
    }));

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, address, isActive } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    const existing = await secureFindOne(Customer, { phone: phone.trim() }).lean();
    if (existing) return res.status(400).json({ message: 'Customer with this phone already exists' });
    const customer = new Customer({
      name: name?.trim(),
      phone: phone?.trim(),
      address: address?.trim() || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, address, isActive } = req.body;
    
    if (phone && phone.trim()) {
      const duplicate = await secureFindOne(Customer, {
        _id: { $ne: req.params.id },
        phone: phone.trim()
      }).lean();
      if (duplicate) {
        return res.status(400).json({ message: 'Another customer with this phone number already exists' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address !== undefined) updates.address = address.trim();
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH customer status (Active/Inactive)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
