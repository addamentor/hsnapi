/**
 * Trainings Admin Controller
 * CRUD operations for training courses
 */
const createCrudController = require('./crudFactory');

const trainingsController = createCrudController('Training', {
    searchFields: ['title', 'module', 'instructor'],
    defaultOrder: [['startDate', 'DESC']]
});

module.exports = trainingsController;
