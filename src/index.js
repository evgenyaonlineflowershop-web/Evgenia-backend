"use strict";

const nodemailer = require("nodemailer");

// Используем прямой IPv4 адрес smtp.gmail.com для Railway 
// и безопасно забираем пароль из переменных окружения
const transporter = nodemailer.createTransport({
  host: "74.125.131.108", // IPv4 для smtp.gmail.com
  port: 587,
  secure: false, 
  auth: {
    user: "evgenyaonlineflowershop@gmail.com",
    pass: process.env.GMAIL_PASS, // Секрет защищен, GitGuardian будет доволен!
  },
  tls: {
    servername: "smtp.gmail.com", 
    rejectUnauthorized: false
  }
});

module.exports = {
  register({ strapi }) {}, //

  bootstrap({ strapi }) { //
    if (strapi.plugin("email")) { //
      strapi.plugin("email").service("email").send = async () => true; //
    } //

    strapi.db.lifecycles.subscribe({ //
      models: ["plugin::users-permissions.user"], //
      async afterCreate(event) { //
        const { result } = event; //
        if (result.confirmed) return; //

        const code = Math.floor(100000 + Math.random() * 900000).toString(); //

        await strapi.db.query("api::otp-code.otp-code").create({ //
          data: { code, user: result.id, used: false, publishedAt: new Date() }, //
        }); //

        try { //
          await transporter.sendMail({ //
            from: '"EvgenyaFlowers" <evgenyaonlineflowershop@gmail.com>', //
            to: result.email, //
            subject: "Код подтверждения", //
            html: `<div style="font-family: sans-serif; text-align: center;"><h1>Ваш код: ${code}</h1></div>`, //
          }); //
          console.log( //
            `✅ Письмо с кодом ${code} успешно отправлено на ${result.email}` //
          ); //
        } catch (err) { //
          console.error("❌ Ошибка отправки почты:", err); //
        } //
      }, //
    }); //
  }, //
};