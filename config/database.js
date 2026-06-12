const path = require("path");

module.exports = ({ env }) => {
  // Если в переменной окружения есть DATABASE_URL (как на Railway),
  // то клиентом автоматически становится 'postgres', иначе 'sqlite'
  const isProduction = env("DATABASE_URL");
  const client = isProduction ? "postgres" : env("DATABASE_CLIENT", "sqlite");

  const connections = {
    postgres: {
      connection: {
        connectionString: env("DATABASE_URL"),
        ssl: {
          rejectUnauthorized: false, // Обязательно для облачных баз вроде Railway
        },
      },
      pool: {
        min: env.int("DATABASE_POOL_MIN", 2),
        max: env.int("DATABASE_POOL_MAX", 10),
      },
    },
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          "..",
          env("DATABASE_FILENAME", ".tmp/data.db") 
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
    },
  };
};
