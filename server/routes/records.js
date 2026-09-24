const express = require('express');
const ParasiteRecord = require('../models/ParasiteRecord');

const router = express.Router();

// GET /api/records?horse=<id>&from=<date>&to=<date>
router.get('/', async (req, res) => {
  const { horse, from, to } = req.query;
  const filter = {};
  if (horse) filter.horse = horse;
  if (from || to) {
    filter.examDate = {};
    if (from) filter.examDate.$gte = new Date(from);
    if (to) filter.examDate.$lte = new Date(to);
  }

  const records = await ParasiteRecord.find(filter)
    .populate('horse', 'name opgThreshold')
    .sort({ examDate: -1 });
  res.json(records);
});

router.post('/', async (req, res) => {
  try {
    const { horse, examDate, opg, parasites, clinicalObservations, antiparasitic, dewormingDate } = req.body;
    if (!horse || !examDate || opg === undefined) {
      return res.status(400).json({ error: 'Equino, data do exame e OPG sao obrigatorios.' });
    }

    const record = await ParasiteRecord.create({
      horse, examDate, opg, parasites, clinicalObservations, antiparasitic, dewormingDate,
      createdBy: req.userId
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar dados clinicos/parasitologicos.', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await ParasiteRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: 'Registro nao encontrado.' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar registro.', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const record = await ParasiteRecord.findByIdAndDelete(req.params.id);
  if (!record) return res.status(404).json({ error: 'Registro nao encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
