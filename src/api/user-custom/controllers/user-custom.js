'use strict';

module.exports = {
  async setInitialPassword(ctx) {
    // Проверяем авторизацию через встроенный стейт Strapi
    if (!ctx.state.user) {
      return ctx.unauthorized('Вы должны быть авторизованы');
    }

    const { password } = ctx.request.body;
    if (!password || password.length < 6) {
      return ctx.badRequest('Пароль должен быть не менее 6 символов');
    }

    const userId = ctx.state.user.id;

    // Обновляем пароль пользователя напрямую в БД
    await strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: { password: password },
    });

    return ctx.send({ ok: true, message: 'Пароль успешно установлен' });
  },
};