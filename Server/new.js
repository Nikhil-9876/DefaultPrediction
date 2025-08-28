const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const SignUpModel = require('./models/SignUpSchema');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174'],
  credentials: true
}));

require('./db/database');

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/user', require('./routes/auth'));
app.use('/results', require('./routes/results'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
