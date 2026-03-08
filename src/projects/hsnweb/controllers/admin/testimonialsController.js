/**
 * Testimonials Admin Controller
 * CRUD operations for customer testimonials
 */
const createCrudController = require('./crudFactory');

const testimonialsController = createCrudController('Testimonial', {
    searchFields: ['content', 'author', 'company'],
    defaultOrder: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
});

module.exports = testimonialsController;
