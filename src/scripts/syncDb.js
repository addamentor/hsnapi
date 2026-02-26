/**
 * Database Sync Script
 * Run: npm run db:sync
 * Run with force: npm run db:sync:force (drops and recreates tables)
 */
require('dotenv').config();
const dbManager = require('../database/DatabaseManager');
const { getDbEnv, getProjects } = require('../config/db.config');

// Import project models
const hsnwebModels = require('../projects/hsnweb/models');

const forceSync = process.argv.includes('--force');

async function syncDatabases() {
    console.log('\n📦 Database Sync Tool');
    console.log('=====================');
    console.log(`Environment: ${getDbEnv()}`);
    console.log(`Force mode: ${forceSync}\n`);
    
    if (forceSync) {
        console.log('⚠️  WARNING: Force mode will DROP ALL TABLES and recreate them!');
        console.log('   All data will be lost. Press Ctrl+C to cancel.\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    try {
        // Sync HSN Web database
        console.log('\n🔗 Connecting to hsnweb database...');
        await dbManager.initProject('hsnweb');
        hsnwebModels.initModels();
        
        console.log('📊 Syncing hsnweb tables...');
        await dbManager.syncProject('hsnweb', { 
            force: forceSync,
            alter: !forceSync 
        });
        
        // Add more projects here as needed
        // await dbManager.initProject('aihunar');
        // aihunarModels.initModels();
        // await dbManager.syncProject('aihunar', { force: forceSync, alter: !forceSync });
        
        console.log('\n✅ Database sync completed successfully!\n');
        
        // Show status
        console.log('Database Status:');
        console.log(JSON.stringify(dbManager.getStatus(), null, 2));
        
    } catch (error) {
        console.error('\n❌ Database sync failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await dbManager.closeAll();
        process.exit(0);
    }
}

syncDatabases();
