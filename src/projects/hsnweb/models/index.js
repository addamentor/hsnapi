/**
 * HSN Web Models Index
 * Initializes and exports all models for the hsnweb project
 */
const dbManager = require('../../../database/DatabaseManager');

// Contact & Newsletter
const defineContactSubmission = require('./ContactSubmission');
const defineNewsletterSubscription = require('./NewsletterSubscription');

// Content Management
const defineTraining = require('./Training');
const defineService = require('./Service');
const defineProduct = require('./Product');
const defineSAPAddon = require('./SAPAddon');
const defineTestimonial = require('./Testimonial');

// Admin & Config
const defineAdminUser = require('./AdminUser');
const defineSiteConfig = require('./SiteConfig');

const PROJECT_NAME = 'hsnweb';

/**
 * Initialize all hsnweb models
 * Must be called after dbManager.initProject('hsnweb')
 */
const initModels = () => {
    const sequelize = dbManager.getConnection(PROJECT_NAME);
    
    // Contact & Newsletter Models
    const ContactSubmission = dbManager.registerModel(
        PROJECT_NAME, 
        'ContactSubmission', 
        defineContactSubmission
    );
    
    const NewsletterSubscription = dbManager.registerModel(
        PROJECT_NAME, 
        'NewsletterSubscription', 
        defineNewsletterSubscription
    );
    
    // Content Management Models
    const Training = dbManager.registerModel(
        PROJECT_NAME,
        'Training',
        defineTraining
    );
    
    const Service = dbManager.registerModel(
        PROJECT_NAME,
        'Service',
        defineService
    );
    
    const Product = dbManager.registerModel(
        PROJECT_NAME,
        'Product',
        defineProduct
    );
    
    const SAPAddon = dbManager.registerModel(
        PROJECT_NAME,
        'SAPAddon',
        defineSAPAddon
    );
    
    const Testimonial = dbManager.registerModel(
        PROJECT_NAME,
        'Testimonial',
        defineTestimonial
    );
    
    // Admin & Config Models
    const AdminUser = dbManager.registerModel(
        PROJECT_NAME,
        'AdminUser',
        defineAdminUser
    );
    
    const SiteConfig = dbManager.registerModel(
        PROJECT_NAME,
        'SiteConfig',
        defineSiteConfig
    );
    
    // Define associations if needed
    // Example: ContactSubmission.belongsTo(User);
    
    return {
        ContactSubmission,
        NewsletterSubscription,
        Training,
        Service,
        Product,
        SAPAddon,
        Testimonial,
        AdminUser,
        SiteConfig
    };
};

/**
 * Get models (after initialization)
 */
const getModels = () => dbManager.getModels(PROJECT_NAME);

module.exports = {
    initModels,
    getModels,
    PROJECT_NAME
};
