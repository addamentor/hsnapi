/**
 * Database Configuration
 * Per-project database configuration with environment support (local/prod)
 */

const DB_ENV = process.env.DB_ENV || 'local'; // 'local' or 'prod'

/**
 * Database configurations for each project
 * Each project can have its own database with local/prod variants
 */
const dbConfigs = {
    // HSN Web Project Database
    hsnweb: {
        local: {
            dialect: process.env.HSNWEB_LOCAL_DB_DIALECT || 'sqlite',
            storage: process.env.HSNWEB_LOCAL_DB_STORAGE || './data/hsnweb_local.sqlite',
            host: process.env.HSNWEB_LOCAL_DB_HOST || 'localhost',
            port: parseInt(process.env.HSNWEB_LOCAL_DB_PORT) || 3306,
            database: process.env.HSNWEB_LOCAL_DB_NAME || 'hsnweb_local',
            username: process.env.HSNWEB_LOCAL_DB_USER || 'root',
            password: process.env.HSNWEB_LOCAL_DB_PASS || '',
            logging: console.log,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        },
        prod: {
            dialect: process.env.HSNWEB_PROD_DB_DIALECT || 'mysql',
            host: process.env.HSNWEB_PROD_DB_HOST || 'localhost',
            port: parseInt(process.env.HSNWEB_PROD_DB_PORT) || 3306,
            database: process.env.HSNWEB_PROD_DB_NAME,
            username: process.env.HSNWEB_PROD_DB_USER,
            password: process.env.HSNWEB_PROD_DB_PASS,
            logging: console.log, // Enable logging temporarily to debug
            pool: {
                max: 10,
                min: 2,
                acquire: 30000,
                idle: 10000
            }
            // SSL disabled for Hostinger MySQL (internal connection)
        }
    },
    
    // AI Hunar Project Database
    aihunar: {
        local: {
            dialect: process.env.AIHUNAR_LOCAL_DB_DIALECT || 'sqlite',
            storage: process.env.AIHUNAR_LOCAL_DB_STORAGE || './data/aihunar_local.sqlite',
            host: process.env.AIHUNAR_LOCAL_DB_HOST || 'localhost',
            port: parseInt(process.env.AIHUNAR_LOCAL_DB_PORT) || 3306,
            database: process.env.AIHUNAR_LOCAL_DB_NAME || 'aihunar_local',
            username: process.env.AIHUNAR_LOCAL_DB_USER || 'root',
            password: process.env.AIHUNAR_LOCAL_DB_PASS || '',
            logging: console.log,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        },
        prod: {
            dialect: process.env.AIHUNAR_PROD_DB_DIALECT || 'mysql',
            host: process.env.AIHUNAR_PROD_DB_HOST,
            port: parseInt(process.env.AIHUNAR_PROD_DB_PORT) || 3306,
            database: process.env.AIHUNAR_PROD_DB_NAME,
            username: process.env.AIHUNAR_PROD_DB_USER,
            password: process.env.AIHUNAR_PROD_DB_PASS,
            logging: false,
            pool: {
                max: 10,
                min: 2,
                acquire: 30000,
                idle: 10000
            }
        }
    }
};

/**
 * Get database configuration for a specific project
 * @param {string} projectName - Name of the project (hsnweb, aihunar, etc.)
 * @param {string} [env] - Environment override ('local' or 'prod')
 * @returns {Object} Database configuration
 */
const getDbConfig = (projectName, env = null) => {
    const environment = env || DB_ENV;
    const projectConfig = dbConfigs[projectName];
    
    if (!projectConfig) {
        throw new Error(`Database configuration not found for project: ${projectName}`);
    }
    
    const config = projectConfig[environment];
    if (!config) {
        throw new Error(`Database configuration not found for project: ${projectName}, environment: ${environment}`);
    }
    
    return {
        ...config,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    };
};

/**
 * Get all project names
 */
const getProjects = () => Object.keys(dbConfigs);

/**
 * Get current database environment
 */
const getDbEnv = () => DB_ENV;

module.exports = {
    dbConfigs,
    getDbConfig,
    getProjects,
    getDbEnv,
    DB_ENV
};
