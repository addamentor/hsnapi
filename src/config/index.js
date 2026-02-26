module.exports = {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    
    // Parse comma-separated origins
    allowedOrigins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:5500'],
    
    // Email configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM || 'noreply@hsntech.in',
        to: process.env.EMAIL_TO || 'info@hsntech.in'
    }
};
