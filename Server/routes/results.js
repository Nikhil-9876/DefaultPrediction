const express = require('express');
const router = express.Router();
const fetchuser = require('../Middleware/fetchuser');
require('dotenv').config();
const { Results} = require('../db/database');

router.get('/GetResults', fetchuser, async (req, res) => {
    try {
        const userResults = await Results.find({ user: req.user.id }).sort({ dateTime: -1 });
        res.json(userResults);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// In your backend routes file
router.post('/SaveResults', fetchuser, async (req, res) => {
    try {
        const { filename, jsonData } = req.body;
        
        const finalFileName = filename || `results_${Date.now()}.json`;

        const newResult = new Results({
            user: req.user.id,
            fileName: finalFileName,
            dateTime: new Date(),
            jsonData: jsonData
        });

        await newResult.save();
        res.status(201).json({
            message: 'Results saved successfully',
            id: newResult._id,
            fileName: newResult.fileName,
            dateTime: newResult.dateTime
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/ClearUserResults', fetchuser, async (req, res) => {
    try {
        const deleted = await Results.deleteMany({ user: req.user.id });

        res.json({
            message: 'All results cleared successfully',
            deletedCount: deleted.deletedCount
        });
    } catch (error) {
        console.error('Error clearing results:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;