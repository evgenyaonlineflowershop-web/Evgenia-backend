'use strict';

module.exports = {
  async sendOtp(ctx) {
    const { email } = ctx.request.body;

    if (!email) return ctx.badRequest('Email обязателен');

    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

    if (!user) return ctx.badRequest('Пользователь не найден');

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Удаляем старые коды для этого пользователя
    await strapi.query('api::otp-code.otp-code').deleteMany({
      where: { user: user.id },
    });

    await strapi.query('api::otp-code.otp-code').create({
      data: {
        user: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 минут
        used: false,
      },
    });

    await strapi.plugin('email').services.email.send({
      to: email,
      from: 'no-reply@yourdomain.com', // замени на свой, если настроил SMTP
      subject: 'Код подтверждения',
      text: `Ваш код: ${code}\nДействует 15 минут.`,
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Действует 15 минут.</p>`,
    });

    return ctx.send({ message: 'Код отправлен на почту' });
  },

  async verifyOtp(ctx) {
    const { email, code } = ctx.request.body;

    if (!email || !code) return ctx.badRequest('Email и код обязательны');

    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

    if (!user) return ctx.badRequest('Пользователь не найден');

    const otp = await strapi.query('api::otp-code.otp-code').findOne({
      where: {
        user: user.id,
        code,
        used: false,
        expiresAt: { $gt: new Date() },
      },
    });

    if (!otp) return ctx.badRequest('Неверный или истёкший код');

    await strapi.query('api::otp-code.otp-code').update({
      where: { id: otp.id },
      data: { used: true },
    });

    if (!user.confirmed) {
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { confirmed: true },
      });
    }

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

    return ctx.send({
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        confirmed: true,
      },
    });
  },
};