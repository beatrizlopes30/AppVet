require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const horseRoutes = require('./routes/horses');
const recordRoutes = require('./routes/records');
const protocolRoutes = require('./routes/protocols');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/horses', auth, horseRoutes);
app.use('/api/records', auth, recordRoutes);
app.use('/api/protocols', auth, protocolRoutes);
app.use('/api/alerts', auth, alertRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`APPVET EQUINO rodando em http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Falha ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });
