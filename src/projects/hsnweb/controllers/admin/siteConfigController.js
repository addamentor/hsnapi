/**
 * Site Config Admin Controller
 * Manages dynamic site configuration
 */
const dbManager = require('../../../../database/DatabaseManager');
const { success, error } = require('../../../../utils/response');

/**
 * Get all configs
 */
const getAll = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const { category } = req.query;

        const where = {};
        if (category) {
            where.category = category;
        }

        const configs = await SiteConfig.findAll({
            where,
            order: [['category', 'ASC'], ['key', 'ASC']]
        });

        return success(res, configs, 'Site configs retrieved');

    } catch (err) {
        console.error('Get site configs error:', err);
        return error(res, 'Failed to get site configs', 500);
    }
};

/**
 * Get config by key
 */
const getByKey = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const config = await SiteConfig.findOne({
            where: { key: req.params.key }
        });

        if (!config) {
            return error(res, 'Config not found', 404);
        }

        return success(res, config, 'Config retrieved');

    } catch (err) {
        console.error('Get site config error:', err);
        return error(res, 'Failed to get config', 500);
    }
};

/**
 * Set config value
 */
const set = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const { key, value, category, description } = req.body;

        if (!key) {
            return error(res, 'Key is required', 400);
        }

        const [config, created] = await SiteConfig.findOrCreate({
            where: { key },
            defaults: { value, category, description }
        });

        if (!created) {
            if (!config.isEditable) {
                return error(res, 'This config is not editable', 403);
            }
            await config.update({ value, category, description });
        }

        return success(res, config, created ? 'Config created' : 'Config updated', created ? 201 : 200);

    } catch (err) {
        console.error('Set site config error:', err);
        return error(res, 'Failed to set config', 500);
    }
};

/**
 * Bulk set configs
 */
const bulkSet = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const { configs } = req.body;

        if (!Array.isArray(configs)) {
            return error(res, 'Configs array required', 400);
        }

        const results = await Promise.all(
            configs.map(async ({ key, value, category, description }) => {
                const [config, created] = await SiteConfig.findOrCreate({
                    where: { key },
                    defaults: { value, category, description }
                });

                if (!created && config.isEditable) {
                    await config.update({ value });
                }

                return config;
            })
        );

        return success(res, results, 'Configs updated');

    } catch (err) {
        console.error('Bulk set site configs error:', err);
        return error(res, 'Failed to set configs', 500);
    }
};

/**
 * Delete config
 */
const remove = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');
        const config = await SiteConfig.findOne({
            where: { key: req.params.key }
        });

        if (!config) {
            return error(res, 'Config not found', 404);
        }

        await config.destroy();
        return success(res, null, 'Config deleted');

    } catch (err) {
        console.error('Delete site config error:', err);
        return error(res, 'Failed to delete config', 500);
    }
};

/**
 * Initialize default configs
 */
const initDefaults = async (req, res) => {
    try {
        const SiteConfig = dbManager.getModel('hsnweb', 'SiteConfig');

        const defaults = [
            {
                key: 'company_name',
                value: 'Hanshivna Tech Private Limited',
                category: 'company',
                description: 'Company full name'
            },
            {
                key: 'company_short_name',
                value: 'HSN Tech',
                category: 'company',
                description: 'Company short name'
            },
            {
                key: 'company_email',
                value: 'to@hanshivnatech.in',
                category: 'company',
                description: 'Company email'
            },
            {
                key: 'company_phone',
                value: '+91 5443358781',
                category: 'company',
                description: 'Company phone'
            },
            {
                key: 'stat_projects',
                value: '200+',
                category: 'statistics',
                description: 'Projects completed'
            },
            {
                key: 'stat_clients',
                value: '20+',
                category: 'statistics',
                description: 'Happy clients'
            },
            {
                key: 'stat_team',
                value: '50+',
                category: 'statistics',
                description: 'Team members'
            },
            {
                key: 'stat_experience',
                value: '5+',
                category: 'statistics',
                description: 'Years of experience'
            }
        ];

        const results = await Promise.all(
            defaults.map(async (config) => {
                const [record, created] = await SiteConfig.findOrCreate({
                    where: { key: config.key },
                    defaults: config
                });
                return { key: config.key, created };
            })
        );

        return success(res, results, 'Default configs initialized');

    } catch (err) {
        console.error('Init defaults error:', err);
        return error(res, 'Failed to initialize defaults', 500);
    }
};

module.exports = {
    getAll,
    getByKey,
    set,
    bulkSet,
    remove,
    initDefaults
};
