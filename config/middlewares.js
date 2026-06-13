module.exports = [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "*.supabase.co", // Разрешаем загрузку картинок из Supabase
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "*.supabase.co", // Разрешаем аудио/видео
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body", // 1. Сначала Strapi парсит пришедший JSON
  //'global::fix-registration', // 2. ТЕПЕРЬ ТУТ МЫ! У нас есть доступ к готовым email и password
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
