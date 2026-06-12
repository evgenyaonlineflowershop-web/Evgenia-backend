module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-supabase",
      providerOptions: {
        baseUrl: env("SUPABASE_URL"),
        url: env("SUPABASE_URL"),
        apiKey: env("SUPABASE_API_KEY"),
        bucket: "evgenia-media",
      },
      responsiveDimensions: false,
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "localhost", // Наша заглушка, чтобы дефолтный Strapi не шумел
        port: 25,
        ignoreTLS: true,
      },
    },
  },
});
