/**
 * @fileoverview Email Service
 * @description SMTP email service for sending deployment notifications and welcome emails
 * @module services/emailService
 * @requires nodemailer
 * @requires fs-extra
 * @requires path
 * @author Utsav Mistry
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

/**
 * Email service for sending transactional emails
 * @class EmailService
 * @classdesc Handles SMTP configuration and email template processing
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Initializes the SMTP transporter with environment configuration
     * @private
     * @method initializeTransporter
     * @returns {void}
     */
    initializeTransporter() {
        // Configure SMTP transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Verifies SMTP server connection
     * @async
     * @method verifyConnection
     * @returns {Promise<boolean>} True if connection is successful
     * @example
     * const isConnected = await emailService.verifyConnection();
     * if (isConnected) {
     *   console.log('Email service ready');
     * }
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP server connection verified');
            return true;
        } catch (error) {
            console.error('SMTP server connection failed:', error);
            return false;
        }
    }

    /**
     * Loads email template from file system
     * @method loadTemplate
     * @param {string} templateName - Name of the template file (without .html extension)
     * @returns {string|null} Template content or null if not found
     * @example
     * const template = emailService.loadTemplate('welcome');
     */
    loadTemplate(templateName) {
        try {
            const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            return fs.readFileSync(templatePath, 'utf-8');
        } catch (error) {
            console.error(`Failed to load email template ${templateName}:`, error);
            return null;
        }
    }

    /**
     * Replaces template variables with actual values
     * @method replaceTemplateVariables
     * @param {string} template - HTML template content
     * @param {Object} variables - Key-value pairs for template replacement
     * @returns {string} Template with variables replaced
     * @example
     * const html = emailService.replaceTemplateVariables(template, {
     *   userName: 'John Doe',
     *   projectName: 'My App'
     * });
     */
    replaceTemplateVariables(template, variables) {
        let result = template;
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
        return result;
    }

    /**
     * Sends deployment started notification email
     * @async
     * @method sendDeploymentStarted
     * @param {string} userEmail - Recipient email address
     * @param {string} projectName - Name of the project being deployed
     * @param {string} deploymentId - Unique deployment identifier
     * @returns {Promise<boolean>} True if email was sent successfully
     * @example
     * await emailService.sendDeploymentStarted('user@example.com', 'My App', 'deploy-123');
     */
    async sendDeploymentStarted(userEmail, projectName, deploymentId) {
        const template = this.loadTemplate('deployment-started');
        if (!template) return false;

        const html = this.replaceTemplateVariables(template, {
            projectName,
            deploymentId,
            dashboardUrl: `${process.env.FRONTEND_URL}/deployments/${deploymentId}/progress`,
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"Shard Platform" <${process.env.BREVO_SENDER_EMAIL || 'auth.vaultify@gmail.com'}>`,
            to: userEmail,
            subject: `Deployment Started - ${projectName}`,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Deployment started email sent to ${userEmail}:`, info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send deployment started email:', error);
            return false;
        }
    }

    /**
     * Sends deployment success notification email
     * @async
     * @method sendDeploymentSuccess
     * @param {string} userEmail - Recipient email address
     * @param {string} projectName - Name of the deployed project
     * @param {string} deploymentId - Unique deployment identifier
     * @param {string} customUrl - URL where the deployed app is accessible
     * @returns {Promise<boolean>} True if email was sent successfully
     * @example
     * await emailService.sendDeploymentSuccess('user@example.com', 'My App', 'deploy-123', 'https://myapp.shard.com');
     */
    async sendDeploymentSuccess(userEmail, projectName, deploymentId, customUrl) {
        const template = this.loadTemplate('deployment-success');
        if (!template) return false;

        const html = this.replaceTemplateVariables(template, {
            projectName,
            deploymentId,
            customUrl,
            dashboardUrl: `${process.env.FRONTEND_URL}/deployments/${deploymentId}`,
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"Shard Platform" <${process.env.BREVO_SENDER_EMAIL || 'auth.vaultify@gmail.com'}>`,
            to: userEmail,
            subject: `Deployment Successful - ${projectName}`,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Deployment success email sent to ${userEmail}:`, info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send deployment success email:', error);
            return false;
        }
    }

    /**
     * Sends deployment failure notification email
     * @async
     * @method sendDeploymentFailed
     * @param {string} userEmail - Recipient email address
     * @param {string} projectName - Name of the project that failed to deploy
     * @param {string} deploymentId - Unique deployment identifier
     * @param {string} [errorMessage] - Error message describing the failure
     * @returns {Promise<boolean>} True if email was sent successfully
     * @example
     * await emailService.sendDeploymentFailed('user@example.com', 'My App', 'deploy-123', 'Build failed');
     */
    async sendDeploymentFailed(userEmail, projectName, deploymentId, errorMessage) {
        const template = this.loadTemplate('deployment-failed');
        if (!template) return false;

        const html = this.replaceTemplateVariables(template, {
            projectName,
            deploymentId,
            errorMessage: errorMessage || 'Unknown error occurred',
            logsUrl: `${process.env.FRONTEND_URL}/deployments/${deploymentId}/logs`,
            supportUrl: `${process.env.FRONTEND_URL}/support`,
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"Shard Platform" <${process.env.BREVO_SENDER_EMAIL || 'auth.vaultify@gmail.com'}>`,
            to: userEmail,
            subject: `Deployment Failed - ${projectName}`,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Deployment failed email sent to ${userEmail}:`, info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send deployment failed email:', error);
            return false;
        }
    }

    /**
     * Sends welcome email to new users
     * @async
     * @method sendWelcomeEmail
     * @param {string} userEmail - New user's email address
     * @param {string} userName - New user's name
     * @returns {Promise<boolean>} True if email was sent successfully
     * @example
     * await emailService.sendWelcomeEmail('newuser@example.com', 'John Doe');
     */
    async sendWelcomeEmail(userEmail, userName) {
        const template = this.loadTemplate('welcome');
        if (!template) return false;

        const html = this.replaceTemplateVariables(template, {
            userName,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            docsUrl: `${process.env.FRONTEND_URL}/docs`,
            supportUrl: `${process.env.FRONTEND_URL}/support`,
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"Shard Platform" <${process.env.BREVO_SENDER_EMAIL || 'auth.vaultify@gmail.com'}>`,
            to: userEmail,
            subject: `🎉 Welcome to Shard Platform!`,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Welcome email sent to ${userEmail}:`, info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return false;
        }
    }
}

/**
 * Singleton email service instance
 * @type {EmailService}
 * @description Pre-configured email service for sending transactional emails
 */
const emailServiceInstance = new EmailService();

/**
 * @namespace emailService
 * @description SMTP email service for deployment notifications and user communications
 */
module.exports = emailServiceInstance;
module.exports.EmailService = EmailService;
