const transporter = require("./emailTransporter");

const sendResponsavelInviteEmail = async (email, athleteName, link) => {
  const mailOptions = {
    from: `"Warera Dōjo" <${process.env.Email_User}>`,
    to: email,
    subject: "Convite para responsável - Warera Dōjo",
    html: `
      <div style="font-family: Arial">
        <h2>Convite para responsável</h2>
        <p>
          Você foi convidado para ser responsável pelo atleta
          <b>${athleteName}</b>.
        </p>
        <a href="${link}"
           style="padding:10px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">
          Aceitar convite
        </a>
        <p style="margin-top:16px;font-size:12px;color:#555">
          Se você não reconhece este convite, ignore este email.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendResponsavelInviteEmail;