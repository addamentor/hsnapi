/**
 * Request validation middleware
 */

/**
 * Validate required fields in request body
 * @param {string[]} fields - Array of required field names
 */
const validateRequired = (fields) => {
    return (req, res, next) => {
        const missing = [];
        
        for (const field of fields) {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }
        
        next();
    };
};

/**
 * Validate email format
 */
const validateEmail = (field = 'email') => {
    return (req, res, next) => {
        const email = req.body[field];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        next();
    };
};

module.exports = {
    validateRequired,
    validateEmail
};
