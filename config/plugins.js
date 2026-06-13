module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-supabase",
      providerOptions: {
        apiUrl: env('SUPABASE_API_URL'),
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_BUCKET'),
        directory: "",
        options: {},
      },
      responsiveDimensions: false, // Давай пока вернем false, чтобы точно исключить нарезку
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "localhost",
        port: 25,
        ignoreTLS: true,
      },
    },
  },
});