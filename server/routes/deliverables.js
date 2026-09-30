const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Deliverable = require('../models/Deliverable');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// Helper: Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET all deliverables
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.activeOnly === 'true') {
      query.isActive = { $ne: false };
    }
    const deliverables = await secureFind(Deliverable, query)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .lean();
    res.json(deliverables);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching deliverables', error: err.message });
  }
});

// POST new deliverable (with Duplicate Prevention & Quick-Add Support)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description = '', isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Deliverable name is required' });
    }

    const trimmedName = name.trim();
    const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');

    // Check for existing deliverable (case-insensitive)
    const existing = await secureFindOne(Deliverable, { name: regex });
    if (existing) {
      if (req.query.quickAdd === 'true') {
        if (!existing.isActive) {
          existing.isActive = true;
          if (description) existing.description = description.trim();
          await existing.save();
        }
        return res.status(200).json(existing);
      }
      return res.status(400).json({
        message: `Deliverable '${existing.name}' already exists${!existing.isActive ? ' (currently inactive)' : ''}`
      });
    }

    const deliverable = new Deliverable({
      name: trimmedName,
      description: description.trim(),
      isActive: Boolean(isActive)
    });

    await deliverable.save();
    res.status(201).json(deliverable);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create deliverable', error: err.message });
  }
});

// PUT update deliverable
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid deliverable ID' });
    }

    const deliverable = await secureFindOne(Deliverable, { _id: req.params.id });
    if (!deliverable) return res.status(404).json({ message: 'Deliverable not found' });

    const { name, description, isActive } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Deliverable name cannot be empty' });
      }

      // Check collision with other deliverables
      const regex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');
      const collision = await secureFindOne(Deliverable, {
        _id: { $ne: req.params.id },
        name: regex
      });

      if (collision) {
        return res.status(400).json({ message: `Deliverable "${trimmedName}" already exists` });
      }

      deliverable.name = trimmedName;
    }

    if (description !== undefined) deliverable.description = description.trim();
    if (isActive !== undefined) deliverable.isActive = Boolean(isActive);

    await deliverable.save();
    res.json(deliverable);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update deliverable', error: err.message });
  }
});

// PATCH toggle active status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid deliverable ID' });
    }

    const deliverable = await secureFindOne(Deliverable, { _id: req.params.id });
    if (!deliverable) return res.status(404).json({ message: 'Deliverable not found' });

    deliverable.isActive = Boolean(req.body.isActive);
    await deliverable.save();
    res.json(deliverable);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// DELETE deliverable
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid deliverable ID' });
    }

    const deliverable = await secureFindOne(Deliverable, { _id: req.params.id });
    if (!deliverable) return res.status(404).json({ message: 'Deliverable not found' });

    await Deliverable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deliverable deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete deliverable', error: err.message });
  }
});

module.exports = router;
