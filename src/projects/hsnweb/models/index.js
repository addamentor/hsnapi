/**
 * HSN Web Models Index
 * Initializes and exports all models for the hsnweb project
 */
const dbManager = require('../../../database/DatabaseManager');
const defineContactSubmission = require('./ContactSubmission');
const defineNewsletterSubscription = require('./NewsletterSubscription');

const PROJECT_NAME = 'hsnweb';

/**
 * Initialize all hsnweb models
 * Must be called after dbManager.initProject('hsnweb')
 */
const initModels = () => {
    const sequelize = dbManager.getConnection(PROJECT_NAME);
    
    // Register models
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
    
    // Define associations if needed
    // Example: ContactSubmission.belongsTo(User);
    
    return {
        ContactSubmission,
        NewsletterSubscription
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
