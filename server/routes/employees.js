const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all employees
router.get('/', auth, async (req, res) => {
  try {
    const employees = await secureFind(Employee, {}, req).sort({ name: 1 }).lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create employee
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, contact, phone, status } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    const employee = new Employee({ name, role, contact: contact || phone, phone: phone || contact, status, studioId: req.studioId });
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update employee
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, role, contact, phone, status } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, studioId: req.studioId },
      { name, role, contact: contact || phone, phone: phone || contact, status },
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, studioId: req.studioId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
