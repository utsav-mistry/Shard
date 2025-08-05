const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",  // Brevo SMTP
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for port 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP connection failed:", error);
    } else {
        console.log("✅ SMTP server ready to send emails");
    }
});

module.exports = transporter;
