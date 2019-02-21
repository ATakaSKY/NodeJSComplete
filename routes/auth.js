const express = require('express');
const { check } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getResetPassword);

router.post(
  '/login',
  [
    check('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    check(
      'password',
      'Please enter a password with text and number and atleast 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('User already exists!');
          }
        });
      }),
    check(
      'password',
      'Please enter a password with text and number and atleast 5 characters.'
    )
      .isLength({ min: 5 })
      .trim()
      .isAlphanumeric(),
    check('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match!');
      }
      return true;
    })
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postResetPassword);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
