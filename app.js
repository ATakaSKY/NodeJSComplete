const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('5c445096a488c54ddc7b2877')
    .then(user => {
      // console.log(user);
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    'mongodb+srv://<user>:<pass>@cluster0-ftnod.mongodb.net/shop?retryWrites=true'
  )
  .then(() => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Max',
          email: 'max@gmail.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    console.log('connected to database');
    app.listen('3000', () => {
      console.log('listening on port 3000');
    });
  })
  .catch(err => {
    console.log(err);
  });
