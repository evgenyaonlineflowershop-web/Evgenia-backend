module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "",
      providerOptions: {
        apiUrl: env("SUPABASE_API_URL"),
        apiKey: env("SUPABASE_API_KEY"),
        bucket: env("SUPABASE_BUCKET", "evgenia-media"), // Имя бакета из Шага 1
        directory: "uploads",
        options: {},
      },
    },
    responsiveDimensions: false,
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
