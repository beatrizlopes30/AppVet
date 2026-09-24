const express = require('express');
const Protocol = require('../models/Protocol');

const router = express.Router();

router.get('/', async (req, res) => {
  const { horse } = req.query;
  const filter = {};
  if (horse) filter.horse = horse;

  const protocols = await Protocol.find(filter)
    .populate('horse', 'name')
    .sort({ nextApplicationDate: 1 });
  res.json(protocols);
});

router.post('/', async (req, res) => {
  try {
    const { horse, protocolType, product, nextApplicationDate, notes, active } = req.body;
    if (!horse || !protocolType || !product) {
      return res.status(400).json({ error: 'Equino, tipo de protocolo e produto sao obrigatorios.' });
    }

    const protocol = await Protocol.create({
      horse, protocolType, product, nextApplicationDate, notes, active,
      createdBy: req.userId
    });
    res.status(201).json(protocol);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar protocolo.', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const protocol = await Protocol.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!protocol) return res.status(404).json({ error: 'Protocolo nao encontrado.' });
    res.json(protocol);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar protocolo.', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const protocol = await Protocol.findByIdAndDelete(req.params.id);
  if (!protocol) return res.status(404).json({ error: 'Protocolo nao encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
