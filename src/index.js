"use strict";

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "evgenyaonlineflowershop@gmail.com",
    pass: "pejgkvbeuzrbheqn", // Твой новый пароль приложения сюда
  },
});

module.exports = {
  register({ strapi }) {}, // Здесь теперь ПУСТО

  bootstrap({ strapi }) {
    if (strapi.plugin("email")) {
      strapi.plugin("email").service("email").send = async () => true;
    }

    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],
      async afterCreate(event) {
        const { result } = event;
        if (result.confirmed) return;

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await strapi.db.query("api::otp-code.otp-code").create({
          data: { code, user: result.id, used: false, publishedAt: new Date() },
        });

        try {
          await transporter.sendMail({
            from: '"EvgenyaFlowers" <evgenyaonlineflowershop@gmail.com>',
            to: result.email,
            subject: "Код подтверждения",
            html: `<div style="font-family: sans-serif; text-align: center;"><h1>Ваш код: ${code}</h1></div>`,
          });
          console.log(
            `✅ Письмо с кодом ${code} отправлено на ${result.email}`
          );
        } catch (err) {
          console.error("❌ Ошибка отправки почты:", err);
        }
      },
    });
  },
};
