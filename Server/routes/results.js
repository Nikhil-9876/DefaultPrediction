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


// Delete a specific result by ID
router.delete('/DeleteResult/:id', fetchuser, async (req, res) => {
    try {
        const resultId = req.params.id;
        
        // Find and delete the result, ensuring it belongs to the authenticated user
        const deletedResult = await Results.findOneAndDelete({
            _id: resultId,
            user: req.user.id
        });

        if (!deletedResult) {
            return res.status(404).json({
                message: 'Result not found or you do not have permission to delete this result'
            });
        }

        res.json({
            message: 'Result deleted successfully',
            deletedResult: {
                id: deletedResult._id,
                fileName: deletedResult.fileName,
                dateTime: deletedResult.dateTime
            }
        });
    } catch (error) {
        console.error('Error deleting result:', error);
        
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid result ID format' });
        }
        
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
