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
        
        // Initialize hsnweb database
        await dbManager.initProject('hsnweb');
        hsnwebModels.initModels();
        
        // Sync database (creates tables if not exist)
        await dbManager.syncProject('hsnweb', { alter: false });
        
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
