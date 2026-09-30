const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const EventCategory = require('../models/EventCategory');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// Helper: Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', auth, async (req, res) => {
  try {
    const categories = await secureFind(EventCategory, {}).sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new event category (with Duplicate Prevention & Smart Reactivation)
router.post('/', auth, async (req, res) => {
  try {
    const { name, showTerms = true, termsAndConditions = '', isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');

    const existing = await secureFindOne(EventCategory, { name: regex });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: `Event category "${trimmedName}" already exists.` });
      }
      // Reactivate if was inactive
      existing.isActive = true;
      if (showTerms !== undefined) existing.showTerms = Boolean(showTerms);
      if (termsAndConditions !== undefined) existing.termsAndConditions = termsAndConditions;
      await existing.save();
      return res.status(200).json(existing);
    }

    const category = new EventCategory({
      name: trimmedName,
      showTerms: Boolean(showTerms),
      termsAndConditions,
      isActive: Boolean(isActive)
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update event category (with Collision Prevention)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await secureFindOne(EventCategory, { _id: req.params.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, showTerms, termsAndConditions, isActive } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Category name cannot be empty' });
      }

      // Check collision with other categories
      const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');
      const collision = await secureFindOne(EventCategory, {
        _id: { $ne: req.params.id },
        name: regex
      });

      if (collision) {
        return res.status(400).json({ message: `Event category "${trimmedName}" already exists.` });
      }

      category.name = trimmedName;
    }

    if (showTerms !== undefined) category.showTerms = Boolean(showTerms);
    if (termsAndConditions !== undefined) category.termsAndConditions = termsAndConditions;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const { isActive } = req.body;
    const category = await EventCategory.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;



