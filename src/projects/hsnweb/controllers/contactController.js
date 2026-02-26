/**
 * Contact Controller for HSN Web
 */
const response = require('../../../utils/response');
const { sendContactNotification } = require('../../../utils/mailer');
const dbManager = require('../../../database/DatabaseManager');

/**
 * Handle contact form submission
 * POST /api/hsnweb/contact
 */
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, company, inquiry, subject, message } = req.body;
        
        // Get IP and user agent for tracking
        const ipAddress = req.ip || req.connection.remoteAddress || null;
        const userAgent = req.get('User-Agent') || null;
        
        // Log the submission
        console.log('Contact form submission:', {
            name,
            email,
            inquiry,
            subject,
            timestamp: new Date().toISOString()
        });
        
        // Save to database
        const ContactSubmission = dbManager.getModel('hsnweb', 'ContactSubmission');
        let emailSent = false;
        
        // Send email notification first
        try {
            await sendContactNotification({
                name,
                email,
                phone,
                company,
                inquiry,
                subject,
                message
            });
            emailSent = true;
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError.message);
            // Don't fail the request if email fails - it's saved in DB
        }
        
        // Create database record
        const submission = await ContactSubmission.create({
            name,
            email,
            phone: phone || null,
            company: company || null,
            inquiryType: inquiry,
            subject,
            message,
            ipAddress,
            userAgent,
            emailSent,
            status: 'new'
        });
        
        console.log('Contact submission saved with ID:', submission.id);
        
        return response.success(res, {
            submitted: true,
            id: submission.id,
            timestamp: submission.createdAt
        }, 'Thank you! Your message has been received. We\'ll get back to you within 24 hours.');
        
    } catch (error) {
        console.error('Contact submission error:', error);
        return response.serverError(res, 'Failed to submit contact form. Please try again.');
    }
};

/**
 * Handle newsletter subscription
 * POST /api/hsnweb/newsletter
 */
const subscribeNewsletter = async (req, res) => {
    try {
        const { email, name, source } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || null;
        
        const NewsletterSubscription = dbManager.getModel('hsnweb', 'NewsletterSubscription');
        
        // Check if already subscribed
        const existing = await NewsletterSubscription.findOne({ where: { email } });
        
        if (existing) {
            if (existing.isActive) {
                return response.success(res, {
                    subscribed: true,
                    email,
                    alreadyExists: true
                }, 'You\'re already subscribed to our newsletter!');
            } else {
                // Reactivate subscription
                await existing.update({ isActive: true, unsubscribedAt: null });
                return response.success(res, {
                    subscribed: true,
                    email,
                    reactivated: true
                }, 'Welcome back! Your subscription has been reactivated.');
            }
        }
        
        // Create new subscription
        const subscription = await NewsletterSubscription.create({
            email,
            name: name || null,
            source: source || 'website',
            ipAddress,
            isActive: true
        });
        
        console.log('Newsletter subscription saved with ID:', subscription.id);
        
        return response.success(res, {
            subscribed: true,
            email,
            id: subscription.id
        }, 'Successfully subscribed to newsletter!');
        
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return response.serverError(res, 'Failed to subscribe. Please try again.');
    }
};

/**
 * Get all contact submissions (Admin)
 * GET /api/hsnweb/admin/contacts
 */
const getContactSubmissions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const ContactSubmission = dbManager.getModel('hsnweb', 'ContactSubmission');
        
        const where = {};
        if (status) where.status = status;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await ContactSubmission.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        
        return response.success(res, {
            submissions: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Get contacts error:', error);
        return response.serverError(res, 'Failed to retrieve contact submissions.');
    }
};

/**
 * Update contact submission status (Admin)
 * PUT /api/hsnweb/admin/contacts/:id
 */
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        const ContactSubmission = dbManager.getModel('hsnweb', 'ContactSubmission');
        
        const submission = await ContactSubmission.findByPk(id);
        if (!submission) {
            return response.notFound(res, 'Contact submission not found.');
        }
        
        await submission.update({
            ...(status && { status }),
            ...(notes !== undefined && { notes })
        });
        
        return response.success(res, submission, 'Contact submission updated.');
        
    } catch (error) {
        console.error('Update contact error:', error);
        return response.serverError(res, 'Failed to update contact submission.');
    }
};

/**
 * Get newsletter subscribers (Admin)
 * GET /api/hsnweb/admin/newsletter
 */
const getNewsletterSubscribers = async (req, res) => {
    try {
        const { active, page = 1, limit = 50 } = req.query;
        const NewsletterSubscription = dbManager.getModel('hsnweb', 'NewsletterSubscription');
        
        const where = {};
        if (active !== undefined) where.isActive = active === 'true';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await NewsletterSubscription.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        
        return response.success(res, {
            subscribers: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        return response.serverError(res, 'Failed to retrieve newsletter subscribers.');
    }
};

module.exports = {
    submitContact,
    subscribeNewsletter,
    getContactSubmissions,
    updateContactStatus,
    getNewsletterSubscribers
};
