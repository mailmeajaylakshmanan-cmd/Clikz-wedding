const express = require('express');
const router = express.Router();
const Deliverable = require('../models/Deliverable');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all deliverables
router.get('/', auth, async (req, res) => {
  try {
    const deliverables = await secureFind(Deliverable, {}).sort({ name: 1 });
    res.json(deliverables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new deliverable
router.post('/', auth, async (req, res) => {
  try {
    const deliverable = new Deliverable(req.body);
    await deliverable.save();
    res.status(201).json(deliverable);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update deliverable
router.put('/:id', auth, async (req, res) => {
  try {
    const deliverable = await secureFindOne(Deliverable, { _id: req.params.id });
    if (!deliverable) return res.status(404).json({ message: 'Deliverable not found' });
    
    Object.assign(deliverable, req.body);
    await deliverable.save();
    res.json(deliverable);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE deliverable
router.delete('/:id', auth, async (req, res) => {
  try {
    const deliverable = await Deliverable.findByIdAndDelete(req.params.id);
    if (!deliverable) return res.status(404).json({ message: 'Deliverable not found' });
    res.json({ message: 'Deliverable deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
