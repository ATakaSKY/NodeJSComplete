const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const mkdirp = require('mkdirp');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

const MONGODB_URI =
  'mongodb+srv://sky:sky1234@cluster0-ftnod.mongodb.net/shop?retryWrites=true';

app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = 'images/';
    mkdirp.sync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    console.log('rejected');
    cb(null, false);
  }
};

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));

//multer for incoming file request
app.use(
  multer({ storage: diskStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => next(new Error(err)));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  return res.redirect('/500');
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log('mongo connected');
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
