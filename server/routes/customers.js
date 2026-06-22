const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all customers (with search for autocomplete)
router.get('/', auth, async (req, res) => {
  try {
    if (search) {
      // High-performance Atlas Search (Requires Search Index to be built manually in MongoDB Atlas)
      // Fallback to normal query if we just want basic regex before index builds:
      const customers = await Customer.aggregate([
        {
          $search: {
            index: "default", // Name of the Atlas Search Index
            text: {
              query: search,
              path: ["name", "phone"]
            }
          }
        },
        { $match: { studioId: req.studioId, isDeleted: false } },
        { $limit: 50 },
        { $sort: { name: 1 } }
      ]);
      return res.json(customers);
    }
    const customers = await secureFind(Customer, {}, req).sort({ name: 1 }).limit(50).lean();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create customer
router.post('/', auth, async (req, res) => {
  try {
    const existing = await secureFindOne(Customer, { phone: req.body.phone }, req).lean();
    if (existing) return res.status(400).json({ message: 'Customer with this phone already exists' });
    const customer = new Customer({ ...req.body, studioId: req.studioId });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, studioId: req.studioId },
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
