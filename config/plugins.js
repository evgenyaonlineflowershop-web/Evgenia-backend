module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-supabase",
      providerOptions: {
        apiUrl: env('SUPABASE_API_URL'),
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_API_BUCKET'),
        // Ссылка на публичный доступ к файлам бакета:
        baseUrl: `${env('SUPABASE_API_URL')}/storage/v1/object/public/${env('SUPABASE_API_BUCKET')}`,
      },
      responsiveDimensions: false,
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