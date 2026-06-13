"use strict";

module.exports = {
  register({ strapi }) {}, //

  bootstrap({ strapi }) { //
    // Заглушаем стандартный плагин Strapi, как и раньше
    if (strapi.plugin("email")) { //
      strapi.plugin("email").service("email").send = async () => true; //
    } //

    strapi.db.lifecycles.subscribe({ //
      models: ["plugin::users-permissions.user"], //
      async afterCreate(event) { //
        const { result } = event; //
        if (result.confirmed) return; //

        // Генерируем 6-значный OTP-код
        const code = Math.floor(100000 + Math.random() * 900000).toString(); //

        // Сохраняем код в базу данных
        await strapi.db.query("api::otp-code.otp-code").create({ //
          data: { code, user: result.id, used: false, publishedAt: new Date() }, //
        }); //

        try {
          // Отправляем письмо через HTTP POST-запрос. Порты Railway его не заблокируют!
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev", // На бесплатном тарифе без своего домена отправка идет отсюда
              to: result.email, //
              subject: "Код подтверждения", //
              html: `<div style="font-family: sans-serif; text-align: center;"><h1>Ваш код: ${code}</h1></div>`, //
            }),
          });

          if (response.ok) {
            console.log(`✅ Письмо с кодом ${code} успешно отправлено через Resend API на ${result.email}`);
          } else {
            const errorData = await response.json();
            console.error("❌ Resend API вернул ошибку:", errorData);
          }
        } catch (err) {
          console.error("❌ Сетевая ошибка при отправке через Resend API:", err);
        }
      }, //
    }); //
  }, //
};