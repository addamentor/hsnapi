/**
 * Admin Routes
 * All routes for the admin panel
 */
const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, adminOnly, superAdminOnly, editorOnly } = require('../middleware/adminAuth');

// Controllers
const authController = require('../controllers/adminAuthController');
const usersController = require('../controllers/adminUsersController');
const dashboardController = require('../controllers/admin/dashboardController');
const trainingsController = require('../controllers/admin/trainingsController');
const servicesController = require('../controllers/admin/servicesController');
const productsController = require('../controllers/admin/productsController');
const sapAddonsController = require('../controllers/admin/sapAddonsController');
const testimonialsController = require('../controllers/admin/testimonialsController');
const siteConfigController = require('../controllers/admin/siteConfigController');
const seedController = require('../controllers/admin/seedController');

// ==========================================
// AUTH ROUTES (Public)
// ==========================================
router.post('/auth/setup', authController.setupAdmin);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);

// ==========================================
// AUTH ROUTES (Protected)
// ==========================================
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.me);
router.put('/auth/password', authenticate, authController.changePassword);

// ==========================================
// DASHBOARD ROUTES
// ==========================================
router.get('/dashboard/overview', authenticate, dashboardController.getOverview);
router.get('/dashboard/contacts', authenticate, dashboardController.getContacts);
router.put('/dashboard/contacts/:id', authenticate, editorOnly, dashboardController.updateContactStatus);
router.get('/dashboard/newsletter', authenticate, dashboardController.getNewsletterSubscribers);

// ==========================================
// USER MANAGEMENT ROUTES (Admin only)
// ==========================================
router.get('/users', authenticate, adminOnly, usersController.getAll);
router.get('/users/:id', authenticate, adminOnly, usersController.getById);
router.post('/users', authenticate, adminOnly, usersController.create);
router.put('/users/:id', authenticate, adminOnly, usersController.update);
router.put('/users/:id/reset-password', authenticate, superAdminOnly, usersController.resetPassword);
router.delete('/users/:id', authenticate, superAdminOnly, usersController.remove);

// ==========================================
// TRAININGS ROUTES
// ==========================================
router.get('/trainings', authenticate, trainingsController.getAll);
router.get('/trainings/:id', authenticate, trainingsController.getById);
router.post('/trainings', authenticate, editorOnly, trainingsController.create);
router.put('/trainings/:id', authenticate, editorOnly, trainingsController.update);
router.put('/trainings/:id/toggle', authenticate, editorOnly, trainingsController.toggleActive);
router.delete('/trainings/:id', authenticate, adminOnly, trainingsController.remove);
router.put('/trainings/bulk/update', authenticate, editorOnly, trainingsController.bulkUpdate);

// ==========================================
// SERVICES ROUTES
// ==========================================
router.get('/services', authenticate, servicesController.getAll);
router.get('/services/:id', authenticate, servicesController.getById);
router.post('/services', authenticate, editorOnly, servicesController.create);
router.put('/services/:id', authenticate, editorOnly, servicesController.update);
router.put('/services/:id/toggle', authenticate, editorOnly, servicesController.toggleActive);
router.delete('/services/:id', authenticate, adminOnly, servicesController.remove);
router.put('/services/bulk/update', authenticate, editorOnly, servicesController.bulkUpdate);

// ==========================================
// PRODUCTS ROUTES
// ==========================================
router.get('/products', authenticate, productsController.getAll);
router.get('/products/:id', authenticate, productsController.getById);
router.post('/products', authenticate, editorOnly, productsController.create);
router.put('/products/:id', authenticate, editorOnly, productsController.update);
router.put('/products/:id/toggle', authenticate, editorOnly, productsController.toggleActive);
router.delete('/products/:id', authenticate, adminOnly, productsController.remove);
router.put('/products/bulk/update', authenticate, editorOnly, productsController.bulkUpdate);

// ==========================================
// SAP ADD-ONS ROUTES
// ==========================================
router.get('/sap-addons', authenticate, sapAddonsController.getAll);
router.get('/sap-addons/:id', authenticate, sapAddonsController.getById);
router.post('/sap-addons', authenticate, editorOnly, sapAddonsController.create);
router.put('/sap-addons/:id', authenticate, editorOnly, sapAddonsController.update);
router.put('/sap-addons/:id/toggle', authenticate, editorOnly, sapAddonsController.toggleActive);
router.delete('/sap-addons/:id', authenticate, adminOnly, sapAddonsController.remove);
router.put('/sap-addons/bulk/update', authenticate, editorOnly, sapAddonsController.bulkUpdate);

// ==========================================
// TESTIMONIALS ROUTES
// ==========================================
router.get('/testimonials', authenticate, testimonialsController.getAll);
router.get('/testimonials/:id', authenticate, testimonialsController.getById);
router.post('/testimonials', authenticate, editorOnly, testimonialsController.create);
router.put('/testimonials/:id', authenticate, editorOnly, testimonialsController.update);
router.put('/testimonials/:id/toggle', authenticate, editorOnly, testimonialsController.toggleActive);
router.delete('/testimonials/:id', authenticate, adminOnly, testimonialsController.remove);
router.put('/testimonials/bulk/update', authenticate, editorOnly, testimonialsController.bulkUpdate);

// ==========================================
// SITE CONFIG ROUTES
// ==========================================
router.get('/config', authenticate, siteConfigController.getAll);
router.get('/config/:key', authenticate, siteConfigController.getByKey);
router.post('/config', authenticate, adminOnly, siteConfigController.set);
router.post('/config/bulk', authenticate, adminOnly, siteConfigController.bulkSet);
router.post('/config/init-defaults', authenticate, superAdminOnly, siteConfigController.initDefaults);
router.delete('/config/:key', authenticate, superAdminOnly, siteConfigController.remove);

// ==========================================
// DATABASE SEED ROUTES (Super Admin only)
// ==========================================
router.get('/seed/status', authenticate, superAdminOnly, seedController.getStatus);
router.post('/seed/run', authenticate, superAdminOnly, seedController.seedAll);

module.exports = router;
