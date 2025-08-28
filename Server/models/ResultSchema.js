// models/Results.js
const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId,required: true},
    fileName: { 
        type: String, 
        required: true 
    },
    dateTime: { 
        type: Date, 
        required: true, 
        default: Date.now 
    },
    jsonData: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    }
});

module.exports = ResultSchema;
