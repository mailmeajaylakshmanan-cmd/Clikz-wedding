const express = require('express');
const router = express.Router();
const EventCategory = require('../models/EventCategory');
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

router.get('/', auth, async (req, res) => {
  try {
    const categories = await secureFind(EventCategory, {}, req).sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const category = new EventCategory({ ...req.body, studioId: req.studioId });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const category = await EventCategory.findOneAndUpdate(
      { _id: req.params.id, studioId: req.studioId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const inUse = await Service.countDocuments({ eventCategory: req.params.id, studioId: req.studioId });
    if (inUse > 0) {
      return res.status(400).json({ message: 'Cannot delete — services are linked to this category' });
    }
    const deleted = await EventCategory.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
