const express = require('express');
const cors = require('cors');
const path = require('path');
const { mongoose } = require('./mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const { config } = require('./config');

const app = express();

// Static resources
// app.use(express.static(path.join(__dirname, "frontend", "build")));

// Session middleware
app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: process.env.SESSION_SECRET || "nsil",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000 * 24 * 1, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  },
  store: MongoStore.create({
    mongoUrl: config.mongodb.url
  })
}));

app.use(cors({
  origin: true,
  optionsSuccessStatus: 200,
  credentials: true,
}));

app.options('*', cors({
  origin: true,
  optionsSuccessStatus: 200,
  credentials: true,
}));

app.use(express.json({
  limit: '100mb',
  parameterLimit: 100000,
  extended: true
}));
app.use(express.urlencoded({
  limit: '100mb',
  parameterLimit: 100000,
  extended: true
}));

// Routers
app.use('/api', require('./controllers/test').router);
app.use('/api', require('./controllers/Workspace').router);
app.use('/api', require('./controllers/Images').router);

// 404 Error or ignoring frontend router
// app.use("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
// });

module.exports = {
  app
};