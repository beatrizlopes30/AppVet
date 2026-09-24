const express = require('express');
const Horse = require('../models/Horse');
const ParasiteRecord = require('../models/ParasiteRecord');
const Protocol = require('../models/Protocol');
const { buildAlerts } = require('../utils/alerts');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [totalHorses, totalActiveProtocols, alerts, recentRecords] = await Promise.all([
      Horse.countDocuments(),
      Protocol.countDocuments({ active: true }),
      buildAlerts(),
      ParasiteRecord.find().populate('horse', 'name').sort({ examDate: -1 }).limit(5)
    ]);

    res.json({
      totalHorses,
      totalActiveProtocols,
      pendingDewormings: alerts.filter((a) => a.type === 'interval').length,
      opgAlerts: alerts.filter((a) => a.type === 'opg').length,
      alerts,
      recentRecords
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dashboard.', details: err.message });
  }
});

module.exports = router;
