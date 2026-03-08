/**
 * Admin Auth Controller
 * Handles admin login, logout, and token refresh
 */
const dbManager = require('../../../database/DatabaseManager');
const { generateTokens, verifyToken } = require('../middleware/adminAuth');
const { success, error } = require('../../../utils/response');

/**
 * Admin Login
 * POST /api/hsnweb/admin/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return error(res, 'Email and password are required', 400);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findOne({ where: { email } });

        if (!user) {
            return error(res, 'Invalid credentials', 401);
        }

        if (!user.isActive) {
            return error(res, 'Account is disabled', 403);
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return error(res, 'Invalid credentials', 401);
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Update last login and refresh token
        await user.update({
            lastLogin: new Date(),
            refreshToken: tokens.refreshToken
        });

        return success(res, {
            user: user.toSafeObject(),
            ...tokens
        }, 'Login successful');

    } catch (err) {
        console.error('Login error:', err);
        return error(res, 'Login failed', 500);
    }
};

/**
 * Refresh Token
 * POST /api/hsnweb/admin/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return error(res, 'Refresh token required', 400);
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return error(res, 'Invalid refresh token', 401);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(decoded.id);

        if (!user || user.refreshToken !== token) {
            return error(res, 'Invalid refresh token', 401);
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token
        await user.update({ refreshToken: tokens.refreshToken });

        return success(res, tokens, 'Token refreshed');

    } catch (err) {
        console.error('Refresh token error:', err);
        return error(res, 'Token refresh failed', 500);
    }
};

/**
 * Logout
 * POST /api/hsnweb/admin/auth/logout
 */
const logout = async (req, res) => {
    try {
        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        await AdminUser.update(
            { refreshToken: null },
            { where: { id: req.user.id } }
        );

        return success(res, null, 'Logged out successfully');

    } catch (err) {
        console.error('Logout error:', err);
        return error(res, 'Logout failed', 500);
    }
};

/**
 * Get current user
 * GET /api/hsnweb/admin/auth/me
 */
const me = async (req, res) => {
    try {
        return success(res, req.user, 'User retrieved');
    } catch (err) {
        console.error('Get me error:', err);
        return error(res, 'Failed to get user', 500);
    }
};

/**
 * Change password
 * PUT /api/hsnweb/admin/auth/password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return error(res, 'Current and new password required', 400);
        }

        if (newPassword.length < 8) {
            return error(res, 'Password must be at least 8 characters', 400);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(req.user.id);

        const isValid = await user.validatePassword(currentPassword);
        if (!isValid) {
            return error(res, 'Current password is incorrect', 401);
        }

        await user.update({ password: newPassword });

        return success(res, null, 'Password changed successfully');

    } catch (err) {
        console.error('Change password error:', err);
        return error(res, 'Password change failed', 500);
    }
};

/**
 * Create first admin user (only works if no admins exist)
 * POST /api/hsnweb/admin/auth/setup
 */
const setupAdmin = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return error(res, 'Email, password, and name are required', 400);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        
        // Check if any admin exists
        const existingAdmin = await AdminUser.findOne();
        if (existingAdmin) {
            return error(res, 'Admin setup already completed', 403);
        }

        // Create super admin
        const admin = await AdminUser.create({
            email,
            password,
            name,
            role: 'super-admin',
            isActive: true
        });

        return success(res, {
            user: admin.toSafeObject()
        }, 'Admin user created successfully', 201);

    } catch (err) {
        console.error('Setup admin error:', err);
        return error(res, 'Admin setup failed', 500);
    }
};

module.exports = {
    login,
    refreshToken,
    logout,
    me,
    changePassword,
    setupAdmin
};
