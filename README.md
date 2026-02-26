# HSN API

Generic API provider for HSN Tech projects. Modular structure allows separate API endpoints and databases for different projects.

## Structure

```
src/
├── index.js                    # Main entry point
├── config/
│   ├── index.js               # General config
│   └── db.config.js           # Database configurations per project
├── database/
│   └── DatabaseManager.js     # Multi-project DB connection manager
├── middleware/                 # Shared middleware
├── utils/                      # Shared utilities
├── scripts/
│   └── syncDb.js              # Database sync script
└── projects/                   # Project-specific APIs
    ├── hsnweb/                 # HSN Tech Website APIs
    │   ├── routes.js
    │   ├── controllers/
    │   └── models/            # Sequelize models
    └── aihunar/                # AI Hunar Project APIs
        └── routes.js
data/                           # SQLite databases (local dev)
```

## Setup

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Database Configuration

### Environment Selection
Set `DB_ENV` in `.env` to switch between environments:
- `local` - Development database (SQLite by default)
- `prod` - Production database (MySQL/PostgreSQL)

### Per-Project Databases
Each project has its own database configuration. Set via environment variables:

```env
# HSN Web - Local (SQLite)
HSNWEB_LOCAL_DB_DIALECT=sqlite
HSNWEB_LOCAL_DB_STORAGE=./data/hsnweb_local.sqlite

# HSN Web - Production (MySQL)
HSNWEB_PROD_DB_DIALECT=mysql
HSNWEB_PROD_DB_HOST=your-db-host.com
HSNWEB_PROD_DB_NAME=hsnweb_prod
HSNWEB_PROD_DB_USER=username
HSNWEB_PROD_DB_PASS=password
```

### Supported Databases
- **SQLite** (default for local) - No setup needed
- **MySQL** - Set dialect to `mysql`
- **PostgreSQL** - Set dialect to `postgres`
- **MSSQL** - Set dialect to `mssql`

### Database Scripts
```bash
# Sync database (create/update tables)
npm run db:sync

# Force sync (DROP and recreate - destroys data!)
npm run db:sync:force
```

## API Endpoints

### HSN Web (`/api/hsnweb`)

**Public:**
- `POST /api/hsnweb/contact` - Contact form submission
- `POST /api/hsnweb/newsletter` - Newsletter subscription

**Admin:**
- `GET /api/hsnweb/admin/contacts` - List contact submissions
- `PUT /api/hsnweb/admin/contacts/:id` - Update contact status
- `GET /api/hsnweb/admin/newsletter` - List newsletter subscribers

### AI Hunar (`/api/aihunar`)
- `GET /api/aihunar/health` - Health check

### Global
- `GET /health` - Server health check with DB status

## Adding a New Project

1. Create folder structure:
   ```
   src/projects/your-project/
   ├── routes.js
   ├── controllers/
   │   └── yourController.js
   └── models/
       ├── index.js
       └── YourModel.js
   ```

2. Add database config in `src/config/db.config.js`:
   ```javascript
   yourproject: {
       local: { dialect: 'sqlite', storage: './data/yourproject.sqlite', ... },
       prod: { dialect: 'mysql', host: '...', ... }
   }
   ```

3. Add environment variables in `.env`:
   ```env
   YOURPROJECT_LOCAL_DB_DIALECT=sqlite
   YOURPROJECT_LOCAL_DB_STORAGE=./data/yourproject.sqlite
   ```

4. Register routes in `src/index.js`:
   ```javascript
   const yourProjectRoutes = require('./projects/your-project/routes');
   app.use('/api/your-project', yourProjectRoutes);
   ```

5. Initialize database in `startServer()`:
   ```javascript
   await dbManager.initProject('yourproject');
   yourProjectModels.initModels();
   await dbManager.syncProject('yourproject');
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| DB_ENV | Database environment | local |
| ALLOWED_ORIGINS | CORS origins (comma-separated) | localhost:3000,localhost:5500 |
| SMTP_HOST | Email server host | smtp.gmail.com |
| SMTP_PORT | Email server port | 587 |
| SMTP_USER | Email username | - |
| SMTP_PASS | Email password/app password | - |
| EMAIL_FROM | Sender email | noreply@hsntech.in |
| EMAIL_TO | Recipient for contact forms | info@hsntech.in |
