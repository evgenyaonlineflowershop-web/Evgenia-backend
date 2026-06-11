module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/auth/set-initial-password',
        handler: 'user-custom.setInitialPassword',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };