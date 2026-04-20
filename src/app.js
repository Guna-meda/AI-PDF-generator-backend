const express = require('express');
const cors = require('cors');
const path = require('path');

const generateRoutes = require('./routes/generate.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Deck Engine API Running');
});

app.use('/api/generate', generateRoutes);
app.use('/outputs', express.static(path.join(process.cwd(), 'outputs')));


module.exports = app;