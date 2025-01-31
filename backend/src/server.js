const { config } = require('./config');
const https = require("https");
const fs = require("fs");

// Init Database

// Start App
console.log("Starting application ...");

const { app } = require("./app");

// https.createServer({
//   key: fs.readFileSync(config.ssl.key),
//   cert: fs.readFileSync(config.ssl.cert),
// }, app).listen(config.express.port, "0.0.0.0", err => {
//   if (err) {
//     console.log("Unable to listen for connections", error)
//   }
//   else console.log(`Listening on port ${config.express.port}`)
// });

app.listen(config.express.port, "0.0.0.0", err => {
  if (err) {
    console.log("Unable to listen for connections", error)
  }
  else console.log(`Listening on port ${config.express.port}`)
});