const mongoose = require('mongoose');

const URL = process.env.MONGODB_URL; // mongodb://localhost:27017/finshield
const conn = mongoose.createConnection(URL);

// Import your schema
const signUpSchema = require('../models/SignUpSchema');
const resultSchema = require('../models/ResultSchema');

// Both models use the same database (finshield) but different collections
const User = conn.model('User', signUpSchema, 'userdetails');     // Uses 'userdetails' collection
const Banker = conn.model('Banker', signUpSchema, 'bankerdetails'); // Uses 'bankerdetails' collection
const Results = conn.model('Result', resultSchema, 'results'); // Uses 'bankerdetails' collection

// Handle connection events
conn.on('connected', () => {
    console.log('MongoDB connected successfully to finshield database');
});

conn.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

conn.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

module.exports = { conn, User, Banker, Results };
