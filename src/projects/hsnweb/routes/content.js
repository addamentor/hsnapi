/**
 * Public Content Routes
 * Public API endpoints for the website to fetch dynamic content
 */
const express = require('express');
const router = express.Router();
const dbManager = require('../../../database/DatabaseManager');
const { success, error } = require('../../../utils/response');
const { Op } = require('sequelize');

/**
 * Get all active trainings
 * GET /api/hsnweb/content/trainings
 */
router.get('/trainings', async (req, res) => {
    try {
        const Training = dbManager.getModel('hsnweb', 'Training');
        const { upcoming, module: trainingModule } = req.query;

        const where = { isActive: true };

        if (upcoming === 'true') {
            where.startDate = { [Op.gte]: new Date() };
            where.status = { [Op.in]: ['Open', 'Draft'] };
        }

        if (trainingModule) {
            where.module = trainingModule;
        }

        const trainings = await Training.findAll({
            where,
            order: [['startDate', 'ASC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        return success(res, trainings, 'Trainings retrieved');

    } catch (err) {
        console.error('Get trainings error:', err);
        return error(res, 'Failed to get trainings', 500);
    }
});

/**
 * Get training by slug
 * GET /api/hsnweb/content/trainings/:slug
 */
router.get('/trainings/:slug', async (req, res) => {
    try {
        const Training = dbManager.getModel('hsnweb', 'Training');
        const training = await Training.findOne({
            where: { slug: req.params.slug, isActive: true }
        });

        if (!training) {
            return error(res, 'Training not found', 404);
        }

        return success(res, training, 'Training retrieved');

    } catch (err) {
        console.error('Get training error:', err);
        return error(res, 'Failed to get training', 500);
    }
});

/**
 * Get all active services
 * GET /api/hsnweb/content/services
 */
router.get('/services', async (req, res) => {
    try {
        const Service = dbManager.getModel('hsnweb', 'Service');
        const { category } = req.query;

        const where = { isActive: true };
        if (category) {
            where.category = category;
        }

        const services = await Service.findAll({
            where,
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        // Group by category if no category filter
        if (!category) {
            const grouped = {
                'core-sap': [],
                'sap-services': [],
                'it-services': [],
                'staff-augmentation': []
            };

            services.forEach(service => {
                if (grouped[service.category]) {
                    grouped[service.category].push(service);
                }
            });

            return success(res, grouped, 'Services retrieved');
        }

        return success(res, services, 'Services retrieved');

    } catch (err) {
        console.error('Get services error:', err);
        return error(res, 'Failed to get services', 500);
    }
});

/**
 * Get service by slug
 * GET /api/hsnweb/content/services/:slug
 */
router.get('/services/:slug', async (req, res) => {
    try {
        const Service = dbManager.getModel('hsnweb', 'Service');
        const service = await Service.findOne({
            where: { slug: req.params.slug, isActive: true }
        });

        if (!service) {
            return error(res, 'Service not found', 404);
        }

        return success(res, service, 'Service retrieved');

    } catch (err) {
        console.error('Get service error:', err);
        return error(res, 'Failed to get service', 500);
    }
});

/**
 * Get all active products
 * GET /api/hsnweb/content/products
 */
router.get('/products', async (req, res) => {
    try {
        const Product = dbManager.getModel('hsnweb', 'Product');
        const { featured } = req.query;

        const where = { isActive: true };
        if (featured === 'true') {
            where.isFeatured = true;
        }

        const products = await Product.findAll({
            where,
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        return success(res, products, 'Products retrieved');

    } catch (err) {
        console.error('Get products error:', err);
        return error(res, 'Failed to get products', 500);
    }
});

/**
 * Get product by slug
 * GET /api/hsnweb/content/products/:slug
 */
router.get('/products/:slug', async (req, res) => {
    try {
        const Product = dbManager.getModel('hsnweb', 'Product');
        const product = await Product.findOne({
            where: { slug: req.params.slug, isActive: true }
        });

        if (!product) {
            return error(res, 'Product not found', 404);
        }

        return success(res, product, 'Product retrieved');

    } catch (err) {
        console.error('Get product error:', err);
        return error(res, 'Failed to get product', 500);
    }
});

/**
 * Get all active SAP add-ons
 * GET /api/hsnweb/content/sap-addons
 */
router.get('/sap-addons', async (req, res) => {
    try {
        const SAPAddon = dbManager.getModel('hsnweb', 'SAPAddon');
        const { category, status } = req.query;

        const where = { isActive: true };
        if (category) {
            where.category = category;
        }
        if (status) {
            where.status = status;
        }

        const addons = await SAPAddon.findAll({
            where,
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        return success(res, addons, 'SAP Add-ons retrieved');

    } catch (err) {
        console.error('Get SAP add-ons error:', err);
        return error(res, 'Failed to get SAP add-ons', 500);
    }
});

/**
 * Get SAP add-on by slug
 * GET /api/hsnweb/content/sap-addons/:slug
 */
router.get('/sap-addons/:slug', async (req, res) => {
    try {
        const SAPAddon = dbManager.getModel('hsnweb', 'SAPAddon');
        const addon = await SAPAddon.findOne({
            where: { slug: req.params.slug, isActive: true }
        });

        if (!addon) {
            return error(res, 'SAP Add-on not found', 404);
        }

        return success(res, addon, 'SAP Add-on retrieved');

    } catch (err) {
        console.error('Get SAP add-on error:', err);
        return error(res, 'Failed to get SAP add-on', 500);
    }
});

/**
 * Get all active testimonials
 * GET /api/hsnweb/content/testimonials
 */
router.get('/testimonials', async (req, res) => {
    try {
        const Testimonial = dbManager.getModel('hsnweb', 'Testimonial');
        const { featured, limit } = req.query;

        const where = { isActive: true };
        if (featured === 'true') {
            where.isFeatured = true;
        }

        const options = {
            where,
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        };

        if (limit) {
            options.limit = parseInt(limit);
        }

        const testimonials = await Testimonial.findAll(options);

        return success(res, testimonials, 'Testimonials retrieved');

    } catch (err) {
        console.error('Get testimonials error:', err);
        return error(res, 'Failed to get testimonials', 500);
    }
});

/**
 * Get site configuration
 * GET /api/hsnweb/content/config
 */
router.get('/config', async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const { category, keys } = req.query;

        const where = {};
        if (category) {
            where.category = category;
        }
        if (keys) {
            where.key = { [Op.in]: keys.split(',') };
        }

        const configs = await SiteConfig.findAll({ where });

        // Convert to key-value object
        const configObj = {};
        configs.forEach(config => {
            configObj[config.key] = config.value;
        });

        return success(res, configObj, 'Config retrieved');

    } catch (err) {
        console.error('Get config error:', err);
        return error(res, 'Failed to get config', 500);
    }
});

/**
 * Get all content for static site generation
 * GET /api/hsnweb/content/all
 */
router.get('/all', async (req, res) => {
    try {
        const models = dbManager.getModels('hsnweb');

        const [trainings, services, products, sapAddons, testimonials, config] = await Promise.all([
            models.Training?.findAll({
                where: { isActive: true },
                order: [['startDate', 'ASC']]
            }) || [],
            models.Service?.findAll({
                where: { isActive: true },
                order: [['sortOrder', 'ASC']]
            }) || [],
            models.Product?.findAll({
                where: { isActive: true },
                order: [['sortOrder', 'ASC']]
            }) || [],
            models.SAPAddon?.findAll({
                where: { isActive: true },
                order: [['sortOrder', 'ASC']]
            }) || [],
            models.Testimonial?.findAll({
                where: { isActive: true },
                order: [['sortOrder', 'ASC']]
            }) || [],
            models.SiteConfig?.findAll() || []
        ]);

        // Convert config to object
        const configObj = {};
        config.forEach(c => {
            configObj[c.key] = c.value;
        });

        return success(res, {
            trainings,
            services,
            products,
            sapAddons,
            testimonials,
            config: configObj
        }, 'All content retrieved');

    } catch (err) {
        console.error('Get all content error:', err);
        return error(res, 'Failed to get content', 500);
    }
});

module.exports = router;
