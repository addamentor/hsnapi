/**
 * Database Connection Manager
 * Manages Sequelize connections for multiple projects
 */
const { Sequelize } = require('sequelize');
const { getDbConfig, getProjects } = require('../config/db.config');

class DatabaseManager {
    constructor() {
        this.connections = {};
        this.models = {};
    }
    
    /**
     * Initialize database connection for a project
     * @param {string} projectName - Name of the project
     * @param {string} [env] - Optional environment override
     * @returns {Sequelize} Sequelize instance
     */
    async initProject(projectName, env = null) {
        if (this.connections[projectName]) {
            return this.connections[projectName];
        }
        
        const config = getDbConfig(projectName, env);
        
        let sequelize;
        
        if (config.dialect === 'sqlite') {
            sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: config.storage,
                logging: config.logging,
                define: config.define
            });
        } else {
            sequelize = new Sequelize(
                config.database,
                config.username,
                config.password,
                {
                    host: config.host,
                    port: config.port,
                    dialect: config.dialect,
                    logging: config.logging,
                    pool: config.pool,
                    define: config.define,
                    dialectOptions: config.dialectOptions
                }
            );
        }
        
        // Test connection
        try {
            await sequelize.authenticate();
            console.log(`✓ Database connected: ${projectName} (${config.dialect})`);
        } catch (error) {
            console.error(`✗ Database connection failed for ${projectName}:`, error.message);
            throw error;
        }
        
        this.connections[projectName] = sequelize;
        this.models[projectName] = {};
        
        return sequelize;
    }
    
    /**
     * Get Sequelize instance for a project
     * @param {string} projectName 
     * @returns {Sequelize}
     */
    getConnection(projectName) {
        if (!this.connections[projectName]) {
            throw new Error(`Database not initialized for project: ${projectName}. Call initProject() first.`);
        }
        return this.connections[projectName];
    }
    
    /**
     * Register a model for a project
     * @param {string} projectName 
     * @param {string} modelName 
     * @param {Function} modelDefiner - Function that takes sequelize and returns model
     */
    registerModel(projectName, modelName, modelDefiner) {
        const sequelize = this.getConnection(projectName);
        const model = modelDefiner(sequelize);
        this.models[projectName][modelName] = model;
        return model;
    }
    
    /**
     * Get a model for a project
     * @param {string} projectName 
     * @param {string} modelName 
     * @returns {Model}
     */
    getModel(projectName, modelName) {
        if (!this.models[projectName] || !this.models[projectName][modelName]) {
            throw new Error(`Model ${modelName} not found for project ${projectName}`);
        }
        return this.models[projectName][modelName];
    }
    
    /**
     * Get all models for a project
     * @param {string} projectName 
     * @returns {Object}
     */
    getModels(projectName) {
        return this.models[projectName] || {};
    }
    
    /**
     * Sync database for a project
     * @param {string} projectName 
     * @param {Object} options - Sequelize sync options
     */
    async syncProject(projectName, options = {}) {
        const sequelize = this.getConnection(projectName);
        await sequelize.sync(options);
        console.log(`✓ Database synced: ${projectName}`);
    }
    
    /**
     * Sync all initialized databases
     * @param {Object} options 
     */
    async syncAll(options = {}) {
        for (const projectName of Object.keys(this.connections)) {
            await this.syncProject(projectName, options);
        }
    }
    
    /**
     * Close connection for a project
     * @param {string} projectName 
     */
    async closeProject(projectName) {
        if (this.connections[projectName]) {
            await this.connections[projectName].close();
            delete this.connections[projectName];
            delete this.models[projectName];
            console.log(`✓ Database closed: ${projectName}`);
        }
    }
    
    /**
     * Close all connections
     */
    async closeAll() {
        for (const projectName of Object.keys(this.connections)) {
            await this.closeProject(projectName);
        }
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        const status = {};
        for (const [project, sequelize] of Object.entries(this.connections)) {
            status[project] = {
                connected: true,
                dialect: sequelize.getDialect(),
                models: Object.keys(this.models[project] || {})
            };
        }
        return status;
    }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
