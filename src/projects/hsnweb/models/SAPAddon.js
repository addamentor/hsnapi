/**
 * SAP Add-on Model
 * Stores SAP add-on products
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SAPAddon = sequelize.define('SAPAddon', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        version: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('Fiori', 'Migration', 'BTP', 'Development', 'Analytics', 'Security', 'Integration', 'Other'),
            defaultValue: 'Other'
        },
        status: {
            type: DataTypes.ENUM('Available', 'Coming Soon', 'Beta', 'Deprecated'),
            defaultValue: 'Available'
        },
        shortDescription: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        features: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of feature strings'
        },
        compatibility: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of compatible systems'
        },
        pricing: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        demoAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        demoLink: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        documentationLink: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'sap_addons',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['status'] },
            { fields: ['is_active'] },
            { fields: ['is_featured'] }
        ]
    });

    return SAPAddon;
};
