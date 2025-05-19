// config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'meetlakhani98787@gmail.com', // Your email
        pass: 'qyzn modm mnsk atzc'   // Your email password
    }
});

module.exports = transporter;