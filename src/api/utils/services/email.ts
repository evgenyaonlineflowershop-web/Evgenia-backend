// @ts-ignore — Если нужно игнорировать весь файл

module.exports = {
    async sendConfirmationEmail(sanitizedUser: any) {  // Добавил : any для sanitizedUser
      // Типизация для обхода ошибок
      const settings: any = strapi.config.get('plugin.users-permissions');  // Убрал 'as any', используем : any
  
      // Используем правильный сервис для JWT
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const confirmationToken = jwtService.issue({ user: sanitizedUser.id });
  
      // Здесь меняем URL на фронт с твоим route: /confirm-email?confirmation=token
      const url = `${process.env.CALLBACK_URL}/confirm-email?confirmation=${confirmationToken}`;
  
      const userPermissionService = strapi.plugin('users-permissions').service('user');
      const sanitizedUserInfo = await userPermissionService.sanitizeUser(sanitizedUser);
  
      settings.message = await userPermissionService.template(settings.message, {
        URL: url,
        SERVER_URL: process.env.CALLBACK_URL,
        ADMIN_URL: `${process.env.CALLBACK_URL}/admin`,
        USER: sanitizedUserInfo,
        CODE: confirmationToken,
      });
  
      await strapi.plugin('email').services.email.sendEmail(settings.message);
    },
  };