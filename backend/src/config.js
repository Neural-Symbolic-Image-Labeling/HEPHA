const config = {
  express: {
    port: process.env.BE_PORT || 8888,
  },
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/NSIL',
  },
  ssl: {
    key: process.env.SSL_KEY || './server.key',
    cert: process.env.SSL_CERT || './server.cert',
  },
}

module.exports = {
  config
}