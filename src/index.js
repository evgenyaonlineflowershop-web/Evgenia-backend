"use strict";

module.exports = {
  register({ strapi }) {}, //

  bootstrap({ strapi }) { //
    // Заглушаем стандартный встроенный плагин почты Strapi
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
          // Отправляем через HTTP API Brevo (порты хостинга не блокируются)
          const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "api-key": process.env.BREVO_API_KEY,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              sender: { 
                name: "EvgenyaFlowers", 
                email: "evgenyaonlineflowershop@gmail.com" // Твой проверенный Gmail-адрес
              },
              to: [{ email: result.email }], // Шлем на реальный email регистрирующегося юзера!
              subject: "Код подтверждения регистрации",
              htmlContent: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                  <h2>Добро пожаловать в EvgenyaFlowers!</h2>
                  <p>Ваш одноразовый код подтверждения для завершения регистрации:</p>
                  <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 2px; border-radius: 8px;">${code}</h1>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
                </div>
              `,
            }),
          });

          if (response.ok) {
            console.log(`✅ Письмо с OTP-кодом ${code} успешно улетело через Brevo на ${result.email}`);
          } else {
            const errorLog = await response.json();
            console.error("❌ Brevo API вернул ошибку при отправке:", errorLog);
          }
        } catch (err) {
          console.error("❌ Сетевая ошибка при запросе к Brevo API:", err);
        }
      }, //
    }); //
  }, //
};