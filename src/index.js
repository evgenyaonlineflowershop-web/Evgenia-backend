"use strict";

module.exports = {
  register({ strapi }) {}, //

  bootstrap({ strapi }) { //
    // Глушим стандартный встроенный плагин почты Strapi
    if (strapi.plugin("email")) { //
      strapi.plugin("email").service("email").send = async () => true; //
    } //

    strapi.db.lifecycles.subscribe({ //
      models: ["plugin::users-permissions.user"], //
      
      async afterCreate(event) { //
        const { result } = event; //
        
        // Если пользователь зашел через Google Auth (уже подтвержден), код слать не нужно
        if (result.confirmed) return; //

        // Генерируем случайный 6-значный OTP-код
        const code = Math.floor(100000 + Math.random() * 900000).toString(); //

        // Сохраняем сгенерированный код в базу данных Strapi
        await strapi.db.query("api::otp-code.otp-code").create({ //
          data: { code, user: result.id, used: false, publishedAt: new Date() }, //
        }); //

        try {
          // ОБЯЗАТЕЛЬНО ДОБАВЛЯЕМ await, чтобы Strapi дождался окончания сетевого запроса!
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev", // На бесплатном аккаунте Resend адрес отправителя всегда такой
              to: result.email, //
              subject: "Код подтверждения регистрации", 
              html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                  <h2>Добро пожаловать!</h2>
                  <p>Ваш одноразовый код подтверждения для завершения регистрации:</p>
                  <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 2px; border-radius: 8px;">${code}</h1>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
                </div>
              `,
            }),
          });

          if (response.ok) {
            console.log(`✅ Письмо с OTP-кодом ${code} успешно отправлено через Resend на ${result.email}`);
          } else {
            const errorLog = await response.json();
            console.error("❌ Resend API вернул ошибку при отправке:", errorLog);
          }
        } catch (err) {
          console.error("❌ Сетевая ошибка отправки через Resend HTTP API:", err);
        }
      }, //
    }); //
  }, //
};