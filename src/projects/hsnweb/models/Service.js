/**
 * Service Model
 * Stores service offerings
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Service = sequelize.define('Service', {
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
        category: {
            type: DataTypes.ENUM('core-sap', 'sap-services', 'it-services', 'staff-augmentation'),
            allowNull: false
        },
        icon: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Font Awesome class e.g., fas fa-cloud'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        tagline: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        shortDescription: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        highlights: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of highlight strings'
        },
        features: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of feature strings'
        },
        stats: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Object with stat key-value pairs'
        },
        gradient: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'CSS gradient string'
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'services',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['is_active'] },
            { fields: ['sort_order'] }
        ]
    });

    return Service;
};
