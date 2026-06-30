const mongoose = require('mongoose');

const operationsSchema = new mongoose.Schema({
  studioId: { type: String, required: true, default: 'default_studio' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, unique: true },
  
  // Kanban Stage
  stage: {
    type: String,
    enum: ['To-Do', 'In-Progress', 'Editing', 'Printed', 'Delivered'],
    default: 'To-Do'
  },
  
  // Pre-Event
  advanceCleared: { type: Boolean, default: false },
  staffAssigned: { type: Boolean, default: false },
  equipmentCheck: { type: Boolean, default: false },
  
  // Event Day
  attendanceLog: { type: Boolean, default: false },
  rawFootageBackup: { type: Boolean, default: false },
  
  // Post-Event
  selectionLinkSent: { type: Boolean, default: false },
  photoEditingComplete: { type: Boolean, default: false },
  videoMixingComplete: { type: Boolean, default: false },
  albumPrinting: { type: Boolean, default: false },
  finalDelivery: { type: Boolean, default: false },

}, { timestamps: true });

operationsSchema.index({ studioId: 1, stage: 1 });

module.exports = mongoose.model('Operations', operationsSchema);
