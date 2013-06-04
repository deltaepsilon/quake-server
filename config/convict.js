var convict = require('convict'),
  conf = convict({
    env: {
      doc: "The applicaton environment.",
      format: ["production", "development", "test"],
      default: "development",
      env: "NODE_ENV"
    },
    ip: {
      doc: "The IP address to bind.",
      format: "ipaddress",
      default: "127.0.0.1",
      env: "QUAKE_IP_ADDRESS"
    },
    port: {
      doc: "The port to bind.",
      format: "port",
      default: 0,
      env: "QUAKE_PORT"
    },
    mongo: {
      doc: "Mongo DB location. Must look like: mongodb://user:pass@host:port/dbnam",
      format: "url",
      default: "mongodb://root:127.0.0.1:27017",
      env: "QUAKE_MONGO"
    },
    mongo_username: {
      doc: "Mongo username",
      format: "*",
      default: "nodejitsu",
      env: "QUAKE_MONGO_USERNAME"
    },
    mongo_password: {
      doc: "Mongo password",
      format: "*",
      default: "1234",
      env: "QUAKE_MONGO_PASSWORD"
    },
    mongo_host: {
      doc: "Mongo host",
      format: "*",
      default: "name@mongohq.com",
      env: "QUAKE_MONGO_HOST"
    },
    mongo_port: {
      doc: "Mongo port",
      format: "*",
      default: "27017",
      env: "QUAKE_MONGO_PORT"
    },
    mongo_db: {
      doc: "Mongo db",
      format: "*",
      default: "awesomesauce",
      env: "QUAKE_MONGO_DB"
    }
  });

conf.validate();

module.exports = conf;