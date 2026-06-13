"use strict";

const nodemailer = require("nodemailer");

// Используем прямой IPv4 адрес smtp.gmail.com, чтобы обойти ограничения Railway
// и не злить TypeScript свойством 'family'
const transporter = nodemailer.createTransport({
  host: "74.125.131.108", // Это smtp.gmail.com в формате IPv4
  port: 587,
  secure: false, 
  auth: {
    user: "evgenyaonlineflowershop@gmail.com",
    pass: "pejgkvbeuzrbheqn", 
  },
  tls: {
    servername: "smtp.gmail.com", // Обязательно для правильной проверки SSL-сертификата Google
    rejectUnauthorized: false
  }
});

module.exports = {
  register({ strapi }) {},

  bootstrap({ strapi }) {
    // Убираем заглушку плагина, чтобы Strapi не перехватывал логику, 
    // и подписываемся на создание пользователя
    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],
      
      async afterCreate(event) {
        const { result } = event;
        
        // Если пользователь уже подтвержден (например, через Google Auth), то код не шлем
        if (result.confirmed) return;

        // Генерируем случайный 6-значный OTP-код
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        try {
          // 1. Создаем запись с OTP-кодом в вашей таблице в БД
          await strapi.db.query("api::otp-code.otp-code").create({
            data: { 
              code, 
              user: result.id, 
              used: false, 
              publishedAt: new Date() 
            },
          });
          console.log(`🎰 OTP-код ${code} успешно сгенерирован в БД для ${result.email}`);
        } catch (dbErr) {
          console.error("❌ Ошибка сохранения OTP-кода в базу данных:", dbErr);
          return; // Если код не записался в БД, отправлять письмо нет смысла
        }

        try {
          // 2. Отправляем письмо вручную через созданный transporter
          await transporter.sendMail({
            from: '"EvgenyaFlowers" <evgenyaonlineflowershop@gmail.com>',
            to: result.email,
            subject: "Код подтверждения",
            html: `
              <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #333;">Добро пожаловать в EvgenyaFlowers!</h2>
                <p>Используйте этот код для подтверждения регистрации:</p>
                <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 2px;">${code}</h1>
              </div>
            `,
          });
          console.log(`✅ Письмо с кодом ${code} отправлено вручную на ${result.email}`);
        } catch (err) {
          console.error("❌ Ошибка отправки почты через ручной nodemailer:", err);
        }
      },
    });
  },
};