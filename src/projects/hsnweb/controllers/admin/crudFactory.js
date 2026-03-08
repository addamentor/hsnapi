/**
 * Generic CRUD Controller Factory
 * Creates standard CRUD operations for any model
 */
const dbManager = require('../../../../database/DatabaseManager');
const { success, error } = require('../../../../utils/response');
const { Op } = require('sequelize');

/**
 * Create a CRUD controller for a model
 * @param {string} modelName - Name of the model in DatabaseManager
 * @param {Object} options - Configuration options
 */
const createCrudController = (modelName, options = {}) => {
    const {
        projectName = 'hsnweb',
        searchFields = ['name', 'title'],
        defaultOrder = [['createdAt', 'DESC']],
        slugField = 'slug',
        beforeCreate,
        beforeUpdate,
        afterCreate,
        afterUpdate
    } = options;

    const getModel = () => dbManager.getModel(projectName, modelName);

    /**
     * Get all records with pagination and filtering
     */
    const getAll = async (req, res) => {
        try {
            const Model = getModel();
            const {
                page = 1,
                limit = 20,
                search,
                sortBy,
                sortOrder = 'DESC',
                ...filters
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const where = {};

            // Search functionality
            if (search && searchFields.length > 0) {
                where[Op.or] = searchFields.map(field => ({
                    [field]: { [Op.like]: `%${search}%` }
                }));
            }

            // Apply additional filters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    // Handle boolean filters
                    if (filters[key] === 'true') {
                        where[key] = true;
                    } else if (filters[key] === 'false') {
                        where[key] = false;
                    } else {
                        where[key] = filters[key];
                    }
                }
            });

            // Build order
            let order = defaultOrder;
            if (sortBy) {
                order = [[sortBy, sortOrder.toUpperCase()]];
            }

            const { rows, count } = await Model.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order
            });

            return success(res, {
                items: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            }, `${modelName} list retrieved`);

        } catch (err) {
            console.error(`Get all ${modelName} error:`, err);
            return error(res, `Failed to get ${modelName} list`, 500);
        }
    };

    /**
     * Get single record by ID
     */
    const getById = async (req, res) => {
        try {
            const Model = getModel();
            const record = await Model.findByPk(req.params.id);

            if (!record) {
                return error(res, `${modelName} not found`, 404);
            }

            return success(res, record, `${modelName} retrieved`);

        } catch (err) {
            console.error(`Get ${modelName} error:`, err);
            return error(res, `Failed to get ${modelName}`, 500);
        }
    };

    /**
     * Get single record by slug
     */
    const getBySlug = async (req, res) => {
        try {
            const Model = getModel();
            const record = await Model.findOne({
                where: { [slugField]: req.params.slug }
            });

            if (!record) {
                return error(res, `${modelName} not found`, 404);
            }

            return success(res, record, `${modelName} retrieved`);

        } catch (err) {
            console.error(`Get ${modelName} by slug error:`, err);
            return error(res, `Failed to get ${modelName}`, 500);
        }
    };

    /**
     * Create new record
     */
    const create = async (req, res) => {
        try {
            const Model = getModel();
            let data = { ...req.body };

            // Run beforeCreate hook if provided
            if (beforeCreate) {
                data = await beforeCreate(data, req);
            }

            // Auto-generate slug if not provided
            if (slugField && !data[slugField]) {
                const nameField = data.name || data.title || '';
                data[slugField] = nameField
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }

            const record = await Model.create(data);

            // Run afterCreate hook if provided
            if (afterCreate) {
                await afterCreate(record, req);
            }

            return success(res, record, `${modelName} created`, 201);

        } catch (err) {
            console.error(`Create ${modelName} error:`, err);
            
            // Handle unique constraint errors
            if (err.name === 'SequelizeUniqueConstraintError') {
                return error(res, 'A record with this value already exists', 409);
            }
            
            return error(res, `Failed to create ${modelName}`, 500);
        }
    };

    /**
     * Update existing record
     */
    const update = async (req, res) => {
        try {
            const Model = getModel();
            const record = await Model.findByPk(req.params.id);

            if (!record) {
                return error(res, `${modelName} not found`, 404);
            }

            let data = { ...req.body };

            // Run beforeUpdate hook if provided
            if (beforeUpdate) {
                data = await beforeUpdate(data, record, req);
            }

            await record.update(data);

            // Run afterUpdate hook if provided
            if (afterUpdate) {
                await afterUpdate(record, req);
            }

            return success(res, record, `${modelName} updated`);

        } catch (err) {
            console.error(`Update ${modelName} error:`, err);
            
            if (err.name === 'SequelizeUniqueConstraintError') {
                return error(res, 'A record with this value already exists', 409);
            }
            
            return error(res, `Failed to update ${modelName}`, 500);
        }
    };

    /**
     * Delete record
     */
    const remove = async (req, res) => {
        try {
            const Model = getModel();
            const record = await Model.findByPk(req.params.id);

            if (!record) {
                return error(res, `${modelName} not found`, 404);
            }

            await record.destroy();

            return success(res, null, `${modelName} deleted`);

        } catch (err) {
            console.error(`Delete ${modelName} error:`, err);
            return error(res, `Failed to delete ${modelName}`, 500);
        }
    };

    /**
     * Bulk update (for reordering, bulk status change, etc.)
     */
    const bulkUpdate = async (req, res) => {
        try {
            const Model = getModel();
            const { items } = req.body;

            if (!Array.isArray(items)) {
                return error(res, 'Items array required', 400);
            }

            const updates = await Promise.all(
                items.map(async (item) => {
                    const record = await Model.findByPk(item.id);
                    if (record) {
                        await record.update(item);
                        return record;
                    }
                    return null;
                })
            );

            return success(res, updates.filter(Boolean), 'Bulk update completed');

        } catch (err) {
            console.error(`Bulk update ${modelName} error:`, err);
            return error(res, `Failed to bulk update ${modelName}`, 500);
        }
    };

    /**
     * Toggle active status
     */
    const toggleActive = async (req, res) => {
        try {
            const Model = getModel();
            const record = await Model.findByPk(req.params.id);

            if (!record) {
                return error(res, `${modelName} not found`, 404);
            }

            await record.update({ isActive: !record.isActive });

            return success(res, record, `${modelName} ${record.isActive ? 'activated' : 'deactivated'}`);

        } catch (err) {
            console.error(`Toggle ${modelName} error:`, err);
            return error(res, `Failed to toggle ${modelName}`, 500);
        }
    };

    return {
        getAll,
        getById,
        getBySlug,
        create,
        update,
        remove,
        bulkUpdate,
        toggleActive
    };
};

module.exports = createCrudController;
