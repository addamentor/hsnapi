require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const dbManager = require('./database/DatabaseManager');
const { getDbEnv } = require('./config/db.config');

// Import project routes
const hsnwebRoutes = require('./projects/hsnweb/routes');
const aihunarRoutes = require('./projects/aihunar/routes');
const n8nRoutes = require('./projects/n8n/routes');

// Import project models
const hsnwebModels = require('./projects/hsnweb/models');

// Guard against multiple starts
let serverStarted = false;

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Logging
if (config.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check with database status
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dbEnv: getDbEnv(),
        databases: dbManager.getStatus()
    });
});

// Initialize DB before routes are used
let dbInitialized = false;
let dbInitPromise = null;

async function ensureDbInitialized() {
    if (dbInitialized) return true;
    if (dbInitPromise) return dbInitPromise;
    
    dbInitPromise = (async () => {
        try {
            console.log('Initializing database on first request...');
            await dbManager.initProject('hsnweb');
            hsnwebModels.initModels();
            // Use alter:true only in dev; in prod just ensure tables exist
            const syncOptions = config.env === 'development' ? { alter: true } : { alter: false };
            await dbManager.syncProject('hsnweb', syncOptions);
            dbInitialized = true;
            console.log('✅ Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            dbInitPromise = null;
            throw error;
        }
    })();
    
    return dbInitPromise;
}

// Middleware to ensure DB is ready before handling requests
app.use('/api', async (req, res, next) => {
    try {
        await ensureDbInitialized();
        next();
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Database not available. Please try again.'
        });
    }
});

// Project routes - modular structure
app.use('/api/hsnweb', hsnwebRoutes);
app.use('/api/aihunar', aihunarRoutes);
app.use('/api/n8n', n8nRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use(errorHandler);

/**
 * Initialize databases and start server
 */
async function startServer() {
    // Prevent multiple starts
    if (serverStarted) {
        console.log('Server already started, ignoring duplicate call');
        return;
    }
    serverStarted = true;
    
    try {
        console.log('\n🔗 Initializing databases...\n');
        console.log('DB_ENV:', getDbEnv());
        console.log('NODE_ENV:', config.env);
        
        // Log DB config (without password)
        const dbConfig = require('./config/db.config');
        const hsnwebConfig = dbConfig.getDbConfig('hsnweb');
        console.log('DB Config:', {
            dialect: hsnwebConfig.dialect,
            host: hsnwebConfig.host,
            database: hsnwebConfig.database,
            username: hsnwebConfig.username,
            port: hsnwebConfig.port
        });
        
        // Initialize database (will be reused if already initialized by middleware)
        await ensureDbInitialized();
        
        // Verify models are accessible
        const registeredModels = dbManager.getModels('hsnweb');
        console.log('✅ Registered models:', Object.keys(registeredModels));
        
        // Initialize aihunar database (uncomment when needed)
        // await dbManager.initProject('aihunar');
        // aihunarModels.initModels();
        // await dbManager.syncProject('aihunar');
        
        console.log('');
        
        // Start server
        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════╗
║           HSN API Server Started               ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                   ║
║  Environment: ${config.env.padEnd(29)}║
║  DB Environment: ${getDbEnv().padEnd(26)}║
║  Time: ${new Date().toLocaleTimeString().padEnd(30)}║
╚════════════════════════════════════════════════╝
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await dbManager.closeAll();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await dbManager.closeAll();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
