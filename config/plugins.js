module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "localhost", // Наша заглушка, чтобы дефолтный Strapi не шумел
        port: 25,
        ignoreTLS: true,
      },
    },
    responsiveDimensions: false,
  },

});
