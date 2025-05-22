const nodemailer = require("nodemailer");
const pug = require("pug");

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name;
        this.url = url;
        this.from = `Rafat Kamel`;
        this.otp = user.otp;
    }
    newTransport() {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "rafatkamel96@gmail.com",
                pass: "wevv zvln bwun pzof",
            },
        });
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            otp: this.otp,
            subject,
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send("welcome", "Welcome to the Geo-Platform Family!");
    }

    async sendPasswordReset() {
        await this.send(
            "passwordReset",
            "Your password reset token (valid for only 10 minutes)"
        );
    }

    async sendOTP() {
        await this.send("OTP", "Active yor account");
    }
};
