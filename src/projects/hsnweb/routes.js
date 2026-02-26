/**
 * HSN Web Project Routes
 * Base path: /api/hsnweb
 */
const express = require('express');
const router = express.Router();

const contactController = require('./controllers/contactController');
const { validateRequired, validateEmail } = require('../../middleware/validate');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Contact form submission
router.post('/contact', 
    validateRequired(['name', 'email', 'inquiry', 'subject', 'message']),
    validateEmail('email'),
    contactController.submitContact
);

// Newsletter subscription
router.post('/newsletter',
    validateRequired(['email']),
    validateEmail('email'),
    contactController.subscribeNewsletter
);

// ==========================================
// ADMIN ROUTES
// Note: Add authentication middleware for production
// ==========================================

// Get all contact submissions
router.get('/admin/contacts', contactController.getContactSubmissions);

// Update contact submission status
router.put('/admin/contacts/:id', contactController.updateContactStatus);

// Get newsletter subscribers
router.get('/admin/newsletter', contactController.getNewsletterSubscribers);

module.exports = router;
