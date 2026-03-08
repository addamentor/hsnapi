/**
 * Admin Authentication Middleware
 * JWT-based authentication for admin routes
 */
const jwt = require('jsonwebtoken');
const dbManager = require('../../../database/DatabaseManager');

const JWT_SECRET = process.env.JWT_SECRET || 'hsn-admin-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Get user from database
        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        req.user = user.toSafeObject();
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Super admin only middleware
 */
const superAdminOnly = authorize('super-admin');

/**
 * Admin and above middleware
 */
const adminOnly = authorize('super-admin', 'admin');

/**
 * Editor and above middleware
 */
const editorOnly = authorize('super-admin', 'admin', 'editor');

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    generateTokens,
    verifyToken,
    authenticate,
    authorize,
    superAdminOnly,
    adminOnly,
    editorOnly
};
