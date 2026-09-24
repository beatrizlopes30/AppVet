const express = require('express');
const Horse = require('../models/Horse');
const ParasiteRecord = require('../models/ParasiteRecord');
const Protocol = require('../models/Protocol');

const router = express.Router();

router.get('/', async (req, res) => {
  const horses = await Horse.find().sort({ name: 1 });
  res.json(horses);
});

router.get('/:id', async (req, res) => {
  const horse = await Horse.findById(req.params.id);
  if (!horse) return res.status(404).json({ error: 'Equino nao encontrado.' });
  res.json(horse);
});

router.post('/', async (req, res) => {
  try {
    const { name, registrationNumber, breed, age, sex, coat, owner, location, opgThreshold, dewormingIntervalDays } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome do equino e obrigatorio.' });

    const horse = await Horse.create({
      name, registrationNumber, breed, age, sex, coat, owner, location,
      opgThreshold, dewormingIntervalDays,
      createdBy: req.userId
    });
    res.status(201).json(horse);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar equino.', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const horse = await Horse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!horse) return res.status(404).json({ error: 'Equino nao encontrado.' });
    res.json(horse);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar equino.', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const horse = await Horse.findByIdAndDelete(req.params.id);
  if (!horse) return res.status(404).json({ error: 'Equino nao encontrado.' });
  await ParasiteRecord.deleteMany({ horse: horse._id });
  await Protocol.deleteMany({ horse: horse._id });
  res.json({ ok: true });
});

module.exports = router;
