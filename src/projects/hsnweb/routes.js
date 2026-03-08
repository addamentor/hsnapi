/**
 * HSN Web Project Routes
 * Base path: /api/hsnweb
 */
const express = require('express');
const router = express.Router();

const contactController = require('./controllers/contactController');
const { validateRequired, validateEmail } = require('../../middleware/validate');

// Import sub-routers
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');

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
// PUBLIC CONTENT ROUTES
// ==========================================
router.use('/content', contentRoutes);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.use('/admin', adminRoutes);

// ==========================================
// LEGACY ADMIN ROUTES (Deprecated - use /admin/* instead)
// ==========================================

// Get all contact submissions
router.get('/legacy/contacts', contactController.getContactSubmissions);

// Update contact submission status
router.put('/legacy/contacts/:id', contactController.updateContactStatus);

// Get newsletter subscribers
router.get('/legacy/newsletter', contactController.getNewsletterSubscribers);

module.exports = router;
