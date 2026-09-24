const mongoose = require('mongoose');

const horseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  registrationNumber: { type: String, trim: true },
  breed: { type: String, trim: true },
  age: { type: Number },
  sex: { type: String, enum: ['Macho', 'Femea', 'Castrado'], default: 'Macho' },
  coat: { type: String, trim: true },
  owner: { type: String, trim: true },
  location: { type: String, trim: true },
  opgThreshold: { type: Number, default: 500 },
  dewormingIntervalDays: { type: Number, default: 90 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Horse', horseSchema);
