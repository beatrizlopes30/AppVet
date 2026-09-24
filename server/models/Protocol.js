const mongoose = require('mongoose');

const protocolSchema = new mongoose.Schema({
  horse: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
  protocolType: { type: String, trim: true, required: true },
  product: { type: String, trim: true, required: true },
  nextApplicationDate: { type: Date },
  notes: { type: String, trim: true },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Protocol', protocolSchema);
