const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage('Title is required with atleast 3 characters'),
    body('price')
      .isFloat()
      .withMessage('Price must be valid'),
    body('description')
      .isLength({ min: 4, max: 500 })
      .trim()
      .withMessage('Description has to be between 4 and 500 characters')
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post(
  '/edit-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage('Title is required with atleast 3 characters'),
    body('price')
      .isFloat()
      .withMessage('Price must be valid'),
    body('description')
      .isLength({ min: 4, max: 500 })
      .trim()
      .withMessage('Description has to be between 4 and 500 characters')
  ],
  adminController.postEditProduct
);

router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
