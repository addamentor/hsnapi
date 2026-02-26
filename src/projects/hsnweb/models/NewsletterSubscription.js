/**
 * NewsletterSubscription Model for HSN Web
 * Stores newsletter subscriptions
 */
const { DataTypes } = require('sequelize');

const defineNewsletterSubscription = (sequelize) => {
    const NewsletterSubscription = sequelize.define('NewsletterSubscription', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        source: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Where the subscription came from (footer, popup, etc.)'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        unsubscribedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'unsubscribed_at'
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            field: 'ip_address'
        }
    }, {
        tableName: 'newsletter_subscriptions',
        timestamps: true,
        indexes: [
            { fields: ['email'], unique: true },
            { fields: ['is_active'] }
        ]
    });
    
    return NewsletterSubscription;
};

module.exports = defineNewsletterSubscription;
