/**
 * Admin Users Controller
 * Manages admin user accounts
 */
const dbManager = require('../../../database/DatabaseManager');
const { success, error } = require('../../../utils/response');

/**
 * Get all admin users
 * GET /api/hsnweb/admin/users
 */
const getAll = async (req, res) => {
    try {
        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        
        const users = await AdminUser.findAll({
            attributes: { exclude: ['password', 'refreshToken'] },
            order: [['createdAt', 'DESC']]
        });

        return success(res, users, 'Users retrieved');

    } catch (err) {
        console.error('Get users error:', err);
        return error(res, 'Failed to get users', 500);
    }
};

/**
 * Get user by ID
 * GET /api/hsnweb/admin/users/:id
 */
const getById = async (req, res) => {
    try {
        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        
        const user = await AdminUser.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!user) {
            return error(res, 'User not found', 404);
        }

        return success(res, user, 'User retrieved');

    } catch (err) {
        console.error('Get user error:', err);
        return error(res, 'Failed to get user', 500);
    }
};

/**
 * Create admin user
 * POST /api/hsnweb/admin/users
 */
const create = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return error(res, 'Email, password, and name are required', 400);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');

        // Check if email exists
        const existing = await AdminUser.findOne({ where: { email } });
        if (existing) {
            return error(res, 'Email already exists', 409);
        }

        // Only super-admin can create other super-admins
        let userRole = role || 'editor';
        if (userRole === 'super-admin' && req.user.role !== 'super-admin') {
            userRole = 'admin';
        }

        const user = await AdminUser.create({
            email,
            password,
            name,
            role: userRole,
            isActive: true
        });

        return success(res, user.toSafeObject(), 'User created', 201);

    } catch (err) {
        console.error('Create user error:', err);
        return error(res, 'Failed to create user', 500);
    }
};

/**
 * Update admin user
 * PUT /api/hsnweb/admin/users/:id
 */
const update = async (req, res) => {
    try {
        const { name, role, isActive } = req.body;

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(req.params.id);

        if (!user) {
            return error(res, 'User not found', 404);
        }

        // Prevent deactivating yourself
        if (req.user.id === user.id && isActive === false) {
            return error(res, 'Cannot deactivate your own account', 400);
        }

        // Only super-admin can change roles to super-admin
        let newRole = role;
        if (role === 'super-admin' && req.user.role !== 'super-admin') {
            newRole = user.role;
        }

        await user.update({
            name: name || user.name,
            role: newRole || user.role,
            isActive: isActive !== undefined ? isActive : user.isActive
        });

        return success(res, user.toSafeObject(), 'User updated');

    } catch (err) {
        console.error('Update user error:', err);
        return error(res, 'Failed to update user', 500);
    }
};

/**
 * Reset user password (super-admin only)
 * PUT /api/hsnweb/admin/users/:id/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return error(res, 'Password must be at least 8 characters', 400);
        }

        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(req.params.id);

        if (!user) {
            return error(res, 'User not found', 404);
        }

        await user.update({ password: newPassword, refreshToken: null });

        return success(res, null, 'Password reset successfully');

    } catch (err) {
        console.error('Reset password error:', err);
        return error(res, 'Failed to reset password', 500);
    }
};

/**
 * Delete admin user
 * DELETE /api/hsnweb/admin/users/:id
 */
const remove = async (req, res) => {
    try {
        const AdminUser = dbManager.getModel('hsnweb', 'AdminUser');
        const user = await AdminUser.findByPk(req.params.id);

        if (!user) {
            return error(res, 'User not found', 404);
        }

        // Prevent deleting yourself
        if (req.user.id === user.id) {
            return error(res, 'Cannot delete your own account', 400);
        }

        // Prevent deleting last super-admin
        if (user.role === 'super-admin') {
            const superAdminCount = await AdminUser.count({ where: { role: 'super-admin' } });
            if (superAdminCount <= 1) {
                return error(res, 'Cannot delete the last super-admin', 400);
            }
        }

        await user.destroy();

        return success(res, null, 'User deleted');

    } catch (err) {
        console.error('Delete user error:', err);
        return error(res, 'Failed to delete user', 500);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    resetPassword,
    remove
};
