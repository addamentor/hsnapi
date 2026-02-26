/**
 * ContactSubmission Model for HSN Web
 * Stores all contact form submissions
 */
const { DataTypes } = require('sequelize');

const defineContactSubmission = (sequelize) => {
    const ContactSubmission = sequelize.define('ContactSubmission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        company: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        inquiryType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'inquiry_type'
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('new', 'read', 'replied', 'closed'),
            defaultValue: 'new'
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            field: 'ip_address'
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'user_agent'
        },
        emailSent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'email_sent'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'contact_submissions',
        timestamps: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['inquiry_type'] },
            { fields: ['status'] },
            { fields: ['created_at'] }
        ]
    });
    
    return ContactSubmission;
};

module.exports = defineContactSubmission;
