/**
 * Admin User Model
 * Stores admin user accounts for the admin panel
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const AdminUser = sequelize.define('AdminUser', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('super-admin', 'admin', 'editor', 'viewer'),
            defaultValue: 'editor'
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        refreshToken: {
            type: DataTypes.STRING(500),
            allowNull: true
        }
    }, {
        tableName: 'admin_users',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // Instance method to check password
    AdminUser.prototype.validatePassword = async function(password) {
        return bcrypt.compare(password, this.password);
    };

    // Instance method to get safe user object (without password)
    AdminUser.prototype.toSafeObject = function() {
        const { password, refreshToken, ...safeUser } = this.toJSON();
        return safeUser;
    };

    return AdminUser;
};
