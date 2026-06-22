const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.eventCategory = req.query.category;
    const services = await secureFind(Service, query, req)
      .populate('eventCategory', 'name showTerms')
      .sort({ name: 1 })
      .lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const service = new Service({ ...req.body, studioId: req.studioId });
    await service.save();
    const populated = await secureFindOne(Service, { _id: service._id }, req).populate('eventCategory', 'name showTerms').lean();
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, studioId: req.studioId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const populated = await secureFindOne(Service, { _id: service._id }, req).populate('eventCategory', 'name showTerms').lean();
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Service.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    if (!deleted) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
