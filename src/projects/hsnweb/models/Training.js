/**
 * Training Model
 * Stores training course information
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Training = sequelize.define('Training', {
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        module: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'e.g., SAP Fiori/UI5, SAP BTP, ABAP/RAP'
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        duration: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'e.g., 30 Days, 45 Days'
        },
        mode: {
            type: DataTypes.ENUM('Online Live', 'Offline', 'Hybrid', 'Self-Paced'),
            defaultValue: 'Online Live'
        },
        timing: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'e.g., Weekends - 10:00 AM to 1:00 PM IST'
        },
        instructor: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        level: {
            type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate', 'Intermediate to Advanced'),
            defaultValue: 'Intermediate'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'INR'
        },
        maxParticipants: {
            type: DataTypes.INTEGER,
            defaultValue: 30
        },
        enrolledCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        topics: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of topic strings'
        },
        prerequisites: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of prerequisite strings'
        },
        certification: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('Draft', 'Open', 'Full', 'In Progress', 'Completed', 'Cancelled'),
            defaultValue: 'Draft'
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
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
        tableName: 'trainings',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['status'] },
            { fields: ['module'] },
            { fields: ['start_date'] },
            { fields: ['is_active'] }
        ]
    });

    return Training;
};
