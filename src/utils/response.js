/**
 * Standard API response helpers
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const error = (res, message = 'Error', statusCode = 400, data = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data
    });
};

const created = (res, data = null, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};

const serverError = (res, message = 'Internal server error') => {
    return error(res, message, 500);
};

module.exports = {
    success,
    error,
    created,
    notFound,
    serverError
};
