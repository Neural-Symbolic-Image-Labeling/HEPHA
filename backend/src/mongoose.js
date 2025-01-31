const mongoose = require('mongoose');
const { config } = require('./config');


console.log("Connecting to database...");
mongoose.connect(config.mongodb.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to database!");
}).catch(err => { 
  console.log("Error connecting to database: " + err);
});

module.exports = {
  mongoose
}