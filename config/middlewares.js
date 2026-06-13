module.exports = [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'"],
          "img-src": ["'self'", "data:", "blob:", "*.supabase.co"],
          "media-src": ["'self'", "data:", "blob:", "*.supabase.co"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body", // Сначала Strapi парсит JSON
  "global::fix-registration", // <-- РАСКОММЕНТИРУЙ ЭТУ СТРОКУ (убери косые черты //)
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];