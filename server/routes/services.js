const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// Helper: Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.categories) {
      query.category = { $in: req.query.categories.split(',') };
    } else if (req.query.category) {
      query.category = req.query.category;
    }
    const services = await secureFind(Service, query)
      .populate('category', 'name showTerms')
      .sort({ name: 1 })
      .lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new service (with Duplicate Prevention & Smart Reactivation)
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, descriptions = [], isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Service name is required' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Event category is required' });
    }

    const trimmedName = name.trim();
    const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');

    // Check if service with same name already exists in this category
    const existing = await secureFindOne(Service, {
      category,
      name: regex
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: `Service "${trimmedName}" already exists under this category.` });
      }
      // If inactive, reactivate it and update details
      existing.isActive = true;
      if (descriptions && Array.isArray(descriptions)) {
        existing.descriptions = descriptions;
      }
      await existing.save();
      const populated = await secureFindOne(Service, { _id: existing._id }).populate('category', 'name showTerms').lean();
      return res.status(200).json(populated);
    }

    const service = new Service({
      name: trimmedName,
      category,
      descriptions: Array.isArray(descriptions) ? descriptions : [],
      isActive: Boolean(isActive)
    });

    await service.save();
    const populated = await secureFindOne(Service, { _id: service._id }).populate('category', 'name showTerms').lean();
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update service (with Collision Prevention)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const service = await secureFindOne(Service, { _id: req.params.id });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const { name, category, descriptions, isActive } = req.body;
    const targetCategory = category || service.category;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Service name cannot be empty' });
      }

      // Check collision with other services in the same category
      const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');
      const collision = await secureFindOne(Service, {
        _id: { $ne: req.params.id },
        category: targetCategory,
        name: regex
      });

      if (collision) {
        return res.status(400).json({ message: `Service "${trimmedName}" already exists under this category.` });
      }

      service.name = trimmedName;
    }

    if (category !== undefined) service.category = category;
    if (descriptions !== undefined) service.descriptions = Array.isArray(descriptions) ? descriptions : [];
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    await service.save();
    const populated = await secureFindOne(Service, { _id: service._id }).populate('category', 'name showTerms').lean();
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    const { isActive } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const populated = await secureFindOne(Service, { _id: service._id }).populate('category', 'name showTerms').lean();
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;



