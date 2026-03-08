/**
 * Site Configuration Model
 * Stores dynamic site configuration (company info, stats, etc.)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SiteConfig = sequelize.define('SiteConfig', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        value: {
            type: DataTypes.JSON,
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('company', 'social', 'statistics', 'seo', 'navigation', 'other'),
            defaultValue: 'other'
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        isEditable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'site_configs',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['key'] },
            { fields: ['category'] }
        ]
    });

    return SiteConfig;
};
