module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-supabase",
      providerOptions: {
        apiUrl: env("SUPABASE_API_URL"),
        apiKey: env("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cnRvZWhmbnJmcnNzeG5pd2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI1MjA1NSwiZXhwIjoyMDk2ODI4MDU1fQ.MzT0vPnEzF8JLcXLRJ-S1U6tXpYcR-9QpEO4iowc1lU"),
        bucket: env("evgenia-media"),
        directory: env("SUPABASE_DIRECTORY", "uploads"),
        options: {},
      },
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "localhost", // Несуществующий хост
        port: 25,
        ignoreTLS: true,
      },
    },
  },
});
