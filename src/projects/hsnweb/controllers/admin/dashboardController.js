/**
 * Dashboard Controller
 * Provides admin dashboard statistics
 */
const dbManager = require('../../../../database/DatabaseManager');
const { success, error } = require('../../../../utils/response');
const { Op } = require('sequelize');

/**
 * Get dashboard overview statistics
 */
const getOverview = async (req, res) => {
    try {
        const models = dbManager.getModels('hsnweb');

        // Get counts for all content types
        const [
            trainingsCount,
            servicesCount,
            productsCount,
            sapAddonsCount,
            testimonialsCount,
            contactsCount,
            newsletterCount
        ] = await Promise.all([
            models.Training?.count() || 0,
            models.Service?.count() || 0,
            models.Product?.count() || 0,
            models.SAPAddon?.count() || 0,
            models.Testimonial?.count() || 0,
            models.ContactSubmission?.count() || 0,
            models.NewsletterSubscription?.count() || 0
        ]);

        // Get recent contact submissions
        const recentContacts = await models.ContactSubmission?.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        }) || [];

        // Get upcoming trainings
        const upcomingTrainings = await models.Training?.findAll({
            where: {
                startDate: { [Op.gte]: new Date() },
                isActive: true
            },
            limit: 5,
            order: [['startDate', 'ASC']]
        }) || [];

        // Get active trainings
        const activeTrainings = await models.Training?.count({
            where: {
                status: 'Open',
                isActive: true
            }
        }) || 0;

        // Get this month's contacts
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyContacts = await models.ContactSubmission?.count({
            where: {
                createdAt: { [Op.gte]: startOfMonth }
            }
        }) || 0;

        return success(res, {
            counts: {
                trainings: trainingsCount,
                services: servicesCount,
                products: productsCount,
                sapAddons: sapAddonsCount,
                testimonials: testimonialsCount,
                contacts: contactsCount,
                newsletter: newsletterCount
            },
            highlights: {
                activeTrainings,
                monthlyContacts
            },
            recentContacts,
            upcomingTrainings
        }, 'Dashboard overview retrieved');

    } catch (err) {
        console.error('Dashboard overview error:', err);
        return error(res, 'Failed to get dashboard overview', 500);
    }
};

/**
 * Get contact submissions with filtering
 */
const getContacts = async (req, res) => {
    try {
        const ContactSubmission = dbManager.getModel('hsnweb', 'ContactSubmission');
        const {
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        if (status) {
            where.status = status;
        }

        if (startDate) {
            where.createdAt = { [Op.gte]: new Date(startDate) };
        }

        if (endDate) {
            where.createdAt = { 
                ...where.createdAt,
                [Op.lte]: new Date(endDate) 
            };
        }

        const { rows, count } = await ContactSubmission.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });

        return success(res, {
            items: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit))
            }
        }, 'Contacts retrieved');

    } catch (err) {
        console.error('Get contacts error:', err);
        return error(res, 'Failed to get contacts', 500);
    }
};

/**
 * Update contact status
 */
const updateContactStatus = async (req, res) => {
    try {
        const ContactSubmission = dbManager.getModel('hsnweb', 'ContactSubmission');
        const { status, notes } = req.body;

        const contact = await ContactSubmission.findByPk(req.params.id);
        if (!contact) {
            return error(res, 'Contact not found', 404);
        }

        await contact.update({ status, notes });
        return success(res, contact, 'Contact updated');

    } catch (err) {
        console.error('Update contact error:', err);
        return error(res, 'Failed to update contact', 500);
    }
};

/**
 * Get newsletter subscribers
 */
const getNewsletterSubscribers = async (req, res) => {
    try {
        const NewsletterSubscription = dbManager.getModel('hsnweb', 'NewsletterSubscription');
        const { page = 1, limit = 50 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows, count } = await NewsletterSubscription.findAndCountAll({
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });

        return success(res, {
            items: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit))
            }
        }, 'Subscribers retrieved');

    } catch (err) {
        console.error('Get subscribers error:', err);
        return error(res, 'Failed to get subscribers', 500);
    }
};

module.exports = {
    getOverview,
    getContacts,
    updateContactStatus,
    getNewsletterSubscribers
};
