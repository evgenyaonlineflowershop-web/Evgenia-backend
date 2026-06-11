module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'localhost', // Несуществующий хост
        port: 25,
        ignoreTLS: true,
      },
    },
  },
});