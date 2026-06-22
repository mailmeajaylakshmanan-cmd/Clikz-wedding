const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET pending staffing events (where staffAllocated.length < requiredStaff)
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingEvents = await secureFind(Invoice, {
      requiredStaff: { $gt: 0 },
      $expr: { $lt: [{ $size: '$staffAllocated' }, '$requiredStaff'] }
    }).sort({ createdAt: -1 }).lean();
    
    res.json(pendingEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST assign crew member to an event
router.post('/assign', auth, async (req, res) => {
  try {
    const { invoiceId, employeeId } = req.body;
    if (!invoiceId || !employeeId) {
      return res.status(400).json({ message: 'invoiceId and employeeId are required' });
    }

    const invoice = await secureFindOne(Invoice, { _id: invoiceId }, req);
    if (!invoice) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const employee = await secureFindOne(Employee, { _id: employeeId }, req).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Crew member not found' });
    }

    // Check if already assigned to this invoice
    const alreadyAssigned = invoice.staffAllocated.some(
      item => item.employeeId.toString() === employeeId
    );
    if (alreadyAssigned) {
      return res.status(400).json({ message: 'Crew member is already assigned to this event!' });
    }

    // Conflict Check: Is the employee already assigned to another event on overlapping eventDates?
    if (invoice.eventDates && invoice.eventDates.length > 0) {
      const conflict = await secureFindOne(Invoice, {
        _id: { $ne: invoiceId },
        eventDates: { $in: invoice.eventDates },
        'staffAllocated.employeeId': employeeId
      }, req).select('eventDates _id invoiceNo').lean();

      if (conflict) {
        return res.status(400).json({
          message: `Conflict: ${employee.name} is already assigned to another event (${conflict.invoiceNo || 'another event'}) on this date (${invoice.eventDate})!`
        });
      }
    } else if (invoice.eventDate) {
      const conflict = await secureFindOne(Invoice, {
        _id: { $ne: invoiceId },
        eventDate: invoice.eventDate,
        'staffAllocated.employeeId': employeeId
      }, req).select('eventDates _id invoiceNo').lean();

      if (conflict) {
        return res.status(400).json({
          message: `Conflict: ${employee.name} is already assigned to another event (${conflict.invoiceNo || 'another event'}) on this date (${invoice.eventDate})!`
        });
      }
    }

    // Assign employee
    invoice.staffAllocated.push({
      employeeId: employee._id,
      name: employee.name,
      role: employee.role
    });

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST unassign crew member from an event
router.post('/unassign', auth, async (req, res) => {
  try {
    const { invoiceId, employeeId } = req.body;
    if (!invoiceId || !employeeId) {
      return res.status(400).json({ message: 'invoiceId and employeeId are required' });
    }

    const invoice = await secureFindOne(Invoice, { _id: invoiceId }, req);
    if (!invoice) {
      return res.status(404).json({ message: 'Event not found' });
    }

    invoice.staffAllocated = invoice.staffAllocated.filter(
      item => item.employeeId.toString() !== employeeId
    );

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
