const nodemailer = require('nodemailer');

const sendAccetEmail = async (email, verificationLink) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.Email_User,
                pass: process.env.Email_Pass
            }
        });

        const mailOptions = {
            from: `"Warera Dōjo" <${process.env.Email_User}>`,
            to: email,
            subject: '',
            html: `
                <div style = 'font-family: Arial, sans-serif;'>
                    <h2>Bem vindo ao Warera Dōjo </h2>
                    <p>Para ativar sua conta, clique no botão abaixo:</p>
                    <a href = '${verificationLink}' style = 'display: inline-block; padding: 10px 16px; background: #1424db; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                        Aceitar
                    </a>
                    <a href = '${verificationLink}' style = 'display: inline-block; padding: 10px 16px; background: #1424db; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                        Recusar
                    </a>
                    <p style = 'margin-top: 20px;'>
                        Se você não criou esta conta, ignore este email.
                    </p>
                </div> `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erro ao enviar email de verificação: ', error);
        throw error;
    }
};

module.exports = sendAccetEmail;