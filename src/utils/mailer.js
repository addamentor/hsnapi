/**
 * Email utility using Nodemailer
 */
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

/**
 * Initialize email transporter
 */
const initTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.pass
            }
        });
    }
    return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {string} [options.from] - Sender email (defaults to config)
 */
const sendEmail = async ({ to, subject, text, html, from }) => {
    const mail = initTransporter();
    
    const mailOptions = {
        from: from || config.email.from,
        to: to,
        subject: subject,
        text: text,
        html: html || text
    };
    
    try {
        const info = await mail.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error.message);
        throw error;
    }
};

/**
 * Send contact form notification email
 */
const sendContactNotification = async (formData) => {
    const { name, email, phone, company, inquiry, subject, message } = formData;
    
    const htmlContent = `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
            </tr>
            ${phone ? `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${phone}</td>
            </tr>
            ` : ''}
            ${company ? `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Company</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${company}</td>
            </tr>
            ` : ''}
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Inquiry Type</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${inquiry}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Subject</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${subject}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Message</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${message}</td>
            </tr>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Submitted at: ${new Date().toLocaleString()}
        </p>
    `;
    
    const textContent = `
New Contact Form Submission
----------------------------
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
Inquiry Type: ${inquiry}
Subject: ${subject}
Message: ${message}
----------------------------
Submitted at: ${new Date().toLocaleString()}
    `;
    
    return sendEmail({
        to: config.email.to,
        subject: `[HSN Website] ${inquiry}: ${subject}`,
        text: textContent,
        html: htmlContent
    });
};

module.exports = {
    sendEmail,
    sendContactNotification
};
