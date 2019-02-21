const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const options = {
  auth: {
    api_key:
      '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'
  }
};

const mailer = nodemailer.createTransport(sgTransport(options));

exports.getLogin = (req, res, next) => {
  console.log(req.session);
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    oldValues: {
      email: '',
      password: ''
    },
    errorArray: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    oldValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    errorArray: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldValues: {
        email: req.body.email,
        password: req.body.password
      },
      errorArray: errors.array()
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: req.session.isLoggedIn,
          errorMessage: 'Invalid credentials',
          oldValues: {
            email: req.body.email,
            password: req.body.password
          },
          errorArray: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(domatch => {
          if (domatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              res.redirect('/');
            });
          }

          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: 'Invalid credentials',
            oldValues: {
              email: req.body.email,
              password: req.body.password
            },
            errorArray: []
          });
        })
        .catch(err => {
          const error = new Error();
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      const error = new Error();
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldValues: {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
      },
      errorArray: errors.array()
    });
  }

  return bcrypt.hash(password, 12).then(hashedPassword => {
    const user = new User({
      email,
      password: hashedPassword,
      cart: { items: [] }
    });
    user.save().then(result => {
      res.redirect('/login');
      return mailer
        .sendMail({
          to: email,
          from: 'doggy@BB.com',
          subject: '<h1>Dont stare at my screes</h1>',
          text: 'Please get lost',
          html: '<strong>Duma fum mast kalander</strong>'
        })
        .catch(err => {
          const error = new Error();
          error.httpStatusCode = 500;
          return next(error);
        });
    });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/resetPassword', {
    path: '/reset',
    pageTitle: 'Reset',
    errorMessage: message,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;

  crypto.randomBytes(32, (err, buf) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    const token = buf.toString('hex');

    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }

        user.resetToken = token;
        user.tokenExpiration = Date.now() + 3600000;
        user.save();
      })
      .then(result => {
        res.redirect('/');
        return mailer
          .sendMail({
            to: email,
            from: 'doggy@BB.com',
            subject: 'Password reset',
            text: 'Please get lost',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a password</p>
              `
          })
          .catch(err => {
            const error = new Error();
            error.httpStatusCode = 500;
            return next(error);
          });
      })
      .catch(err => {
        const error = new Error();
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, tokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'Password Reset',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error();
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const password = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let recentUser;

  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    tokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      recentUser = user;
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      recentUser.password = hashedPassword;
      recentUser.resetToken = undefined;
      recentUser.tokenExpiration = undefined;
      return recentUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error();
      error.httpStatusCode = 500;
      return next(error);
    });
};
