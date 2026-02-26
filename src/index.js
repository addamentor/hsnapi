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

// Import project models
const hsnwebModels = require('./projects/hsnweb/models');

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

// Project routes - modular structure
app.use('/api/hsnweb', hsnwebRoutes);
app.use('/api/aihunar', aihunarRoutes);

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
        
        // Initialize hsnweb database
        console.log('Connecting to hsnweb database...');
        await dbManager.initProject('hsnweb');
        console.log('✅ Database connected');
        
        console.log('Initializing hsnweb models...');
        const models = hsnwebModels.initModels();
        console.log('✅ Models initialized:', Object.keys(models));
        
        // Sync database (creates tables if not exist)
        console.log('Syncing hsnweb database (creating tables)...');
        await dbManager.syncProject('hsnweb', { alter: true });
        console.log('✅ Database sync complete - tables created/updated');
        
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
