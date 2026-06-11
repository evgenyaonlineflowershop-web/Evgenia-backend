module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',            // 1. Сначала Strapi парсит пришедший JSON
  'global::fix-registration', // 2. ТЕПЕРЬ ТУТ МЫ! У нас есть доступ к готовым email и password
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];