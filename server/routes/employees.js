const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// Helper: Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET all employees
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    const employees = await secureFind(Employee, query).sort({ name: 1 }).lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create employee (with duplicate phone and name check)
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, phone = '', status = 'Active' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone ? phone.trim() : '';

    // Check duplicate phone if provided
    if (trimmedPhone) {
      const existingPhone = await secureFindOne(Employee, { phone: trimmedPhone });
      if (existingPhone) {
        return res.status(400).json({ message: `Crew member with phone number "${trimmedPhone}" already exists (${existingPhone.name})` });
      }
    }

    // Check duplicate name + role
    const nameRegex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');
    const existingName = await secureFindOne(Employee, { name: nameRegex, role: role.trim() });
    if (existingName) {
      return res.status(400).json({ message: `Crew member "${trimmedName}" with role "${role.trim()}" already exists` });
    }

    const employee = new Employee({
      name: trimmedName,
      role: role.trim(),
      phone: trimmedPhone,
      status: status || 'Active'
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update employee (with collision check)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await secureFindOne(Employee, { _id: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const { name, role, phone, status } = req.body;

    if (phone && phone.trim()) {
      const duplicatePhone = await secureFindOne(Employee, {
        _id: { $ne: req.params.id },
        phone: phone.trim()
      });
      if (duplicatePhone) {
        return res.status(400).json({ message: `Another crew member with phone number "${phone.trim()}" already exists (${duplicatePhone.name})` });
      }
    }

    if (name && name.trim()) {
      const targetRole = role ? role.trim() : employee.role;
      const nameRegex = new RegExp(`^${escapeRegex(name.trim())}$`, 'i');
      const duplicateName = await secureFindOne(Employee, {
        _id: { $ne: req.params.id },
        name: nameRegex,
        role: targetRole
      });
      if (duplicateName) {
        return res.status(400).json({ message: `Another crew member "${name.trim()}" with role "${targetRole}" already exists` });
      }
      employee.name = name.trim();
    }

    if (role !== undefined) employee.role = role.trim();
    if (phone !== undefined) employee.phone = phone.trim();
    if (status !== undefined) employee.status = status;

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH employee status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const { status } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

