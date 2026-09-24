const Horse = require('../models/Horse');
const ParasiteRecord = require('../models/ParasiteRecord');

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

// Gera alertas de OPG acima do limite e de intervalo de vermifugacao excedido,
// com base nos parametros (opgThreshold, dewormingIntervalDays) configurados por equino.
async function buildAlerts() {
  const horses = await Horse.find();
  const alerts = [];
  const today = new Date();

  for (const horse of horses) {
    const records = await ParasiteRecord.find({ horse: horse._id }).sort({ examDate: -1 });
    if (records.length === 0) continue;

    const latestOpgRecord = records[0];
    if (latestOpgRecord.opg > horse.opgThreshold) {
      alerts.push({
        type: 'opg',
        horseId: horse._id,
        horseName: horse.name,
        message: `OPG acima do limite configurado: ${horse.name} apresentou OPG de ${latestOpgRecord.opg} em ${new Date(latestOpgRecord.examDate).toLocaleDateString('pt-BR')}.`,
        examDate: latestOpgRecord.examDate,
        opg: latestOpgRecord.opg,
        threshold: horse.opgThreshold
      });
    }

    const dewormingRecords = records.filter((r) => r.dewormingDate);
    if (dewormingRecords.length > 0) {
      const lastDeworming = dewormingRecords.reduce((latest, r) =>
        new Date(r.dewormingDate) > new Date(latest.dewormingDate) ? r : latest
      );
      const elapsed = daysBetween(today, new Date(lastDeworming.dewormingDate));
      if (elapsed >= horse.dewormingIntervalDays) {
        alerts.push({
          type: 'interval',
          horseId: horse._id,
          horseName: horse.name,
          message: `Intervalo de acompanhamento atingido: revisar o manejo parasitario de ${horse.name}.`,
          lastDewormingDate: lastDeworming.dewormingDate,
          elapsedDays: elapsed,
          intervalDays: horse.dewormingIntervalDays
        });
      }
    }
  }

  return alerts;
}

module.exports = { buildAlerts };
