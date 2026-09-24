const mongoose = require('mongoose');

const parasiteRecordSchema = new mongoose.Schema({
  horse: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
  examDate: { type: Date, required: true },
  opg: { type: Number, required: true },
  parasites: { type: String, trim: true },
  clinicalObservations: { type: String, trim: true },
  antiparasitic: { type: String, trim: true },
  dewormingDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

parasiteRecordSchema.index({ horse: 1, examDate: -1 });

module.exports = mongoose.model('ParasiteRecord', parasiteRecordSchema);
