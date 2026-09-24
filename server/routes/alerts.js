const express = require('express');
const { buildAlerts } = require('../utils/alerts');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const alerts = await buildAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar alertas.', details: err.message });
  }
});

module.exports = router;
