"use strict";

const nodemailer = require("nodemailer");

// Явно настраиваем ручной транспортер для Gmail
// Настройка транспортера с обходом ограничений Railway (IPv4 + Port 587)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false для порта 587 (STARTTLS)
  connectionTimeout: 10000, // 10 секунд на таймаут, чтобы запрос не висел по 2 минуты
  greetingTimeout: 10000,
  dnsTimeout: 10000,
  auth: {
    user: "evgenyaonlineflowershop@gmail.com",
    pass: "pejgkvbeuzrbheqn", 
  },
  tls: {
    // Эта строчка принудительно отключает проверку IPv6, если Railway капризничает
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