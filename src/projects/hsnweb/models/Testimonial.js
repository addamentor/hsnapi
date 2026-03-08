/**
 * Testimonial Model
 * Stores customer testimonials
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Testimonial = sequelize.define('Testimonial', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        author: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        role: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        company: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        avatar: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Initials like VM, SJ'
        },
        avatarImage: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 5
            }
        },
        projectType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Type of project for this testimonial'
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
        tableName: 'testimonials',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['is_active'] },
            { fields: ['is_featured'] }
        ]
    });

    return Testimonial;
};
