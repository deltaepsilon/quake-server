var convict = require('convict'),
conf = convict({
  env: {
    doc: "The applicaton environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  quiver_external: {
    doc: "Quiver external path",
    format: "*",
    default: "https://quiver.is",
    env: "QUIVER_EXTERNAL"
  },
  quiver_host: {
    doc: "Quiver host",
    format: "ipaddress",
    default: "127.0.0.1",
    env: "QUIVER_HOST"
  },
  quiver_port: {
    doc: "Quiver port",
    format: "port",
    default: 9000,
    env: "QUIVER_PORT"
  },
  quake_external: {
    doc: "Quake external path",
    format: "url",
    default: "https://api.quiver.is",
    env: "QUAKE_EXTERNAL"
  },
  quake_host: {
      doc: "Quake host",
      format: "ipaddress",
      default: "127.0.0.1",
      env: "QUAKE_HOST"
  },
  quake_port: {
      doc: "Quake port",
      format: "port",
      default: 9001,
      env: "QUAKE_PORT"
  },
  mongo: {
    doc: "Mongo DB location. Must look like: mongodb://user:pass@host:port/dbnam",
    format: "*",
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
  },
  redis_host: {
    doc: "Redis host",
    format: "*",
    default: "127.0.0.1",
    env: "REDIS_HOST"
  },
  redis_port: {
    doc: "Redis port",
    format: "*",
    default: 6379,
    env: "REDIS_PORT"
  },
  redis_password: {
    doc: "Redis password",
    format: "*",
    default: "You should really change this",
    env: "REDIS_PASSWORD"
  },
  redis_secret: {
    doc: "Redis secret",
    format: "*",
    default: "You should really change this",
    env: "REDIS_SECRET"
  },
  stripe_sk: {
    doc: "Stripe secret key",
    format: "*",
    default: "You should really change this",
    env: "QUIVER_STRIPE_SK"
  },
  client_id: {
    doc: "OAuth2 client id",
    format: "*",
    default: "You should really change this",
    env: "QUAKE_CLIENT_ID"
  },
  client_secret: {
    doc: "OAuth2 client secret",
    format: "*",
    default: "You should really change this",
    env: "QUAKE_CLIENT_SECRET"
  }
});

conf.validate();

module.exports = conf;
