/**
 * Product Model
 * Stores product information (AiHunar, Kotwal, etc.)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
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
        tagline: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        website: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        logo: {
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
        benefits: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of benefit strings'
        },
        gradient: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'CSS gradient string'
        },
        screenshots: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of screenshot URLs'
        },
        pricing: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Pricing tiers object'
        },
        ctaText: {
            type: DataTypes.STRING(100),
            defaultValue: 'Learn More'
        },
        ctaLink: {
            type: DataTypes.STRING(500),
            allowNull: true
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
        tableName: 'products',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['is_active'] },
            { fields: ['is_featured'] },
            { fields: ['sort_order'] }
        ]
    });

    return Product;
};
