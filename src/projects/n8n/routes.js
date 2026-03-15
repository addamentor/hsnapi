/**
 * AI Hunar Project Routes
 * Base path: /api/n8n
 * 
 * Add your N8N specific API endpoints here
 */
const express = require('express');
const router = express.Router();

const ffmpeg = require('./controllers/ffmpegController');

// Placeholder - health check for this project
router.get('/health', (req, res) => {
    res.json({
        success: true,
        project: 'n8n',
        status: 'ok',
        message: 'N8N API is ready'
    });
});


router.post('/ffmpeg', 
    ffmpeg.uploadFields,
    ffmpeg.submitFfmpeg
);

// TODO: Add N8N specific routes here
// Example:
// const userController = require('./controllers/userController');
// router.post('/users', userController.create);

module.exports = router;
