/**
 * SAP Add-ons Admin Controller
 * CRUD operations for SAP add-on products
 */
const createCrudController = require('./crudFactory');

const sapAddonsController = createCrudController('SAPAddon', {
    searchFields: ['name', 'shortDescription', 'description'],
    defaultOrder: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
});

module.exports = sapAddonsController;
