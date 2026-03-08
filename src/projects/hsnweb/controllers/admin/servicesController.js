/**
 * Services Admin Controller
 * CRUD operations for services
 */
const createCrudController = require('./crudFactory');

const servicesController = createCrudController('Service', {
    searchFields: ['title', 'shortDescription', 'description'],
    defaultOrder: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
});

module.exports = servicesController;
