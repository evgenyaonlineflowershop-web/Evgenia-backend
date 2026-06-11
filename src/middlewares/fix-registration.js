"use strict";

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const cleanPath = ctx.path.replace(/\/$/, "").toLowerCase();

    // 1. БЕЗОПАСНЫЙ ПЕРЕХВАТ ВЕРИФИКАЦИИ OTP
    if (cleanPath === "/api/auth/verify-otp" && ctx.method === "POST") {
      console.log("====================================");
      console.log("⚡️ [МИДЛВАР] Безопасный перехват verify-otp сработал!");

      const body = ctx.request.body || {};
      const { email, code } = body;
      console.log(`📥 Данные с фронта -> email: "${email}", code: "${code}"`);

      if (!email || !code) {
        ctx.status = 400;
        ctx.body = {
          data: null,
          error: {
            status: 400,
            name: "BadRequestError",
            message: "Email и код обязательны",
          },
        };
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Ищем юзера
      const users = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: { email: cleanEmail },
        }
      );
      const user = users && users.length > 0 ? users[0] : null;

      if (!user) {
        console.log(`❌ Юзер с email "${cleanEmail}" не найден`);
        ctx.status = 400;
        ctx.body = {
          data: null,
          error: {
            status: 400,
            name: "BadRequestError",
            message: "Неверный или истёкший код",
          },
        };
        return;
      }

      // Достаем коды
      const otpRecords = await strapi.entityService.findMany(
        "api::otp-code.otp-code",
        {
          filters: { user: user.id },
        }
      );
      console.log(
        "🔍 Найдено кодов в базе:",
        JSON.stringify(otpRecords, null, 2)
      );

      // Сверяем код
      const validOtp = otpRecords.find((record) => {
        return (
          record.code.toString().trim() === code.toString().trim() &&
          (record.used === false || record.used === 0)
        );
      });

      if (!validOtp) {
        console.log(`❌ Код "${code}" не подошел или уже использован`);
        ctx.status = 400;
        ctx.body = {
          data: null,
          error: {
            status: 400,
            name: "BadRequestError",
            message: "Неверный или истёкший код",
          },
        };
        return;
      }

      // Активируем юзера и тушим код
      await strapi.entityService.update("api::otp-code.otp-code", validOtp.id, {
        data: { used: true },
      });
      await strapi.entityService.update(
        "plugin::users-permissions.user",
        user.id,
        { data: { confirmed: true } }
      );

      console.log("🎉 УСПЕХ: Юзер верифицирован!");
      console.log("====================================");

      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });

      ctx.status = 200;
      ctx.body = {
        jwt,
        user: { id: user.id, email: user.email, confirmed: true },
      };
      return;
    }

    // 2. ПЕРЕХВАТЫВАЕМ ПОВТОРНУЮ ОТПРАВКУ (resend-otp)
    if (cleanPath === "/api/auth/resend-otp" && ctx.method === "POST") {
      const body = ctx.request.body || {};
      const { email } = body;
      if (!email) {
        ctx.status = 400;
        ctx.body = { error: "Email обязателен" };
        return;
      }

      const users = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: { email: email.toLowerCase().trim() },
        }
      );
      const user = users && users.length > 0 ? users[0] : null;

      if (!user) {
        ctx.status = 400;
        ctx.body = { error: "Пользователь не найден" };
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await strapi.entityService.create("api::otp-code.otp-code", {
        data: { code, user: user.id, used: false, publishedAt: new Date() },
      });

      ctx.status = 200;
      ctx.body = { ok: true };
      return;
    }

    // 3. ТВОЙ СТАРЫЙ КОД: ПЕРЕХВАТ РЕГИСТРАЦИИ
    if (cleanPath === "/api/auth/local/register" && ctx.method === "POST") {
      console.log("=== МИДЛВАР: Перехвачен запрос на регистрацию! ===");

      if (ctx.request && ctx.request.body) {
        const { email, password, username } = ctx.request.body;

        if (email) {
          const targetEmail = email.toLowerCase().trim();
          const targetUsername = username ? username.trim() : targetEmail;

          ctx.request.body.username = targetUsername;
          ctx.request.body.email = targetEmail;

          const existingUsers = await strapi.entityService.findMany(
            "plugin::users-permissions.user",
            {
              filters: {
                $or: [{ email: targetEmail }, { username: targetUsername }],
              },
            }
          );

          if (existingUsers && existingUsers.length > 0) {
            for (const user of existingUsers) {
              if (user.confirmed === false) {
                console.log(
                  `Удаляем старого неподтвержденного юзера ID: ${user.id}`
                );
                await strapi.entityService.delete(
                  "plugin::users-permissions.user",
                  user.id
                );
              } else {
                ctx.status = 400;
                ctx.body = {
                  error: "Этот Email или Имя пользователя уже заняты",
                };
                return;
              }
            }
          }
        }
      }
      await next();
      return;
    }

    // 4. ТВОЙ СТАРЫЙ КОД: ПЕРЕХВАТ ВХОДA
    if (cleanPath === "/api/auth/local" && ctx.method === "POST") {
      try {
        await next();
      } catch (err) {
        if (ctx.request && ctx.request.body) {
          const { identifier, password } = ctx.request.body;

          if (identifier && password) {
            const targetIdentifier = identifier.toLowerCase().trim();
            const users = await strapi.entityService.findMany(
              "plugin::users-permissions.user",
              {
                filters: {
                  $or: [
                    { email: targetIdentifier },
                    { username: targetIdentifier },
                  ],
                },
              }
            );

            const user = users && users.length > 0 ? users[0] : null;

            if (user && user.confirmed === false) {
              const upUserService =
                strapi.plugins["users-permissions"].services.user;
              const validPassword = await upUserService.validatePassword(
                password,
                user.password
              );

              if (validPassword) {
                const jwt = strapi
                  .plugin("users-permissions")
                  .service("jwt")
                  .issue({ id: user.id });
                const sanitizedUser = await upUserService.sanitizeUser(
                  user,
                  ctx
                );

                ctx.status = 200;
                ctx.body = { jwt, user: sanitizedUser };
                return;
              }
            }
          }
        }
        throw err;
      }
      return;
    }

    await next();
  };
};
