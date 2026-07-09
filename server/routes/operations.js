const express = require('express');
const router = express.Router();
const Operations = require('../models/Operations');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { secureFind, secureFindOne } = require('../utils/queryHelper');

// GET all operations (with auto-sync for new invoices)
router.get('/', auth, async (req, res) => {
  try {
    // 1. Fetch all active invoices (only need basic info for the board)
    const invoices = await secureFind(Invoice, {})
      .select('invoiceNo customer event eventCategoryName date eventDate location status')
      .lean();

    // 2. Fetch all operations
    let operations = await secureFind(Operations, {}).lean();
    const opsByInvoiceId = new Map(operations.map(op => [op.invoice.toString(), op]));

    // 3. Auto-sync: Create missing operations
    const newOpsToInsert = [];
    const mergedResults = [];

    for (const inv of invoices) {
      const invIdStr = inv._id.toString();
      if (!opsByInvoiceId.has(invIdStr)) {
        // Create new operations document for this invoice
        const newOp = {

          invoice: inv._id,
          stage: 'To-Do',
          advanceCleared: false,
          staffAssigned: false,
          equipmentCheck: false,
          attendanceLog: false,
          rawFootageBackup: false,
          selectionLinkSent: false,
          photoEditingComplete: false,
          videoMixingComplete: false,
          albumPrinting: false,
          finalDelivery: false,
        };
        newOpsToInsert.push(newOp);
        
        mergedResults.push({
          ...newOp,
          invoice: inv // Populate invoice data for the frontend
        });
      } else {
        mergedResults.push({
          ...opsByInvoiceId.get(invIdStr),
          invoice: inv
        });
      }
    }

    // Insert missing operations in bulk if any
    if (newOpsToInsert.length > 0) {
      await Operations.insertMany(newOpsToInsert);
    }

    res.json(mergedResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET single operation by invoiceId
router.get('/:invoiceId', auth, async (req, res) => {
  try {
    let op = await secureFindOne(Operations, { invoice: req.params.invoiceId });
    if (!op) {
      return res.status(404).json({ message: 'Operation not found for this invoice' });
    }
    res.json(op);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update operation field (stage or checklist item)
router.patch('/:invoiceId', auth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const updates = req.body;
    
    let op = await secureFindOne(Operations, { invoice: invoiceId });
    if (!op) {
      // Create if it somehow doesn't exist
      op = new Operations({
        invoice: invoiceId,
        ...updates
      });
      await op.save();
    } else {
      Object.assign(op, updates);
      await op.save();
    }
    
    res.json(op);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
