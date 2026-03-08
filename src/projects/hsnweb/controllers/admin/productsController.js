/**
 * Products Admin Controller
 * CRUD operations for products
 */
const createCrudController = require('./crudFactory');

const productsController = createCrudController('Product', {
    searchFields: ['name', 'tagline', 'description'],
    defaultOrder: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
});

module.exports = productsController;
