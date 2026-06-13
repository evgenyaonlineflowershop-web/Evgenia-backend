"use strict";

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const cleanPath = ctx.path.replace(/\/$/, "").toLowerCase();

    // 1. ПЕРЕХВАТ ВЕРИФИКАЦИИ OTP
    if (cleanPath === "/api/auth/verify-otp" && ctx.method === "POST") {
      console.log("====================================");
      console.log("⚡️ [МИДЛВАР] Проверка verify-otp запущена!");

      const body = ctx.request.body || {};
      const { email, code } = body;

      if (!email || !code) {
        ctx.status = 400;
        ctx.body = { error: { message: "Email и код обязательны" } };
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Ищем юзера напрямую в базе данных
      const user = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { email: cleanEmail },
      });

      if (!user) {
        console.log(`❌ Юзер с email "${cleanEmail}" не найден`);
        ctx.status = 400;
        ctx.body = { error: { message: "Пользователь не найден" } };
        return;
      }

      if (user.confirmed) {
        console.log(`ℹ️ Юзер "${cleanEmail}" уже был подтвержден ранее`);
        // Если уже подтвержден, просто выдаем токен для входа
        const jwt = strapi.plugin("users-permissions").service("jwt").issue({ id: user.id });
        ctx.status = 200;
        ctx.body = {
          jwt,
          user: { id: user.id, username: user.username, email: user.email, confirmed: true }
        };
        return;
      }

      // Ищем последний созданный OTP-код для этого юзера через db.query (чтобы видеть Draft-записи!)
      const otpRecord = await strapi.db.query("api::otp-code.otp-code").findOne({
        where: {
          code: code.trim(),
          user: user.id,
          used: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        console.log(`❌ Код ${code} для ${cleanEmail} не найден в базе или уже использован`);
        ctx.status = 400;
        ctx.body = { error: { message: "Неверный код подтверждения" } };
        return;
      }

      console.log(`✅ Код ${code} совпал! Активируем пользователя...`);

      // Помечаем код как использованный
      await strapi.db.query("api::otp-code.otp-code").update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      // Активируем аккаунт пользователя
      const updatedUser = await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { confirmed: true },
      });

      // Генерируем JWT токен для автоматического входа на фронтенде
      const jwt = strapi.plugin("users-permissions").service("jwt").issue({ id: user.id });

      console.log(`🎉 Пользователь ${cleanEmail} успешно подтвержден!`);
      
      ctx.status = 200;
      ctx.body = {
        jwt,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          confirmed: true,
        },
      };
      return;
    }

    await next();
  };
};