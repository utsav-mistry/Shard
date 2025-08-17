const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

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

    loadTemplate(templateName) {
        try {
            const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            return fs.readFileSync(templatePath, 'utf-8');
        } catch (error) {
            console.error(`Failed to load email template ${templateName}:`, error);
            return null;
        }
    }

    replaceTemplateVariables(template, variables) {
        let result = template;
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
        return result;
    }

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

module.exports = new EmailService();
