/**
 * Global error handler middleware
 */
module.exports = (err, req, res, next) => {
    console.error('Error:', err.message);
    
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
