const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user
  });
  product.save();
  res.redirect('/');
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;

  if (!JSON.parse(editMode)) {
    return res.redirect('/');
  }

  Product.findById(req.params.productId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;

  const product = new Product({ title, price, description, imageUrl });
  Product.update(
    { _id: prodId },
    { $set: { title, price, description, imageUrl } },
    (err, res) => {
      if (err) {
        throw err;
      }
    }
  ).then(() => {
    console.log('product UPDATED!');
    res.redirect('/admin/products');
  });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByIdAndDelete(prodId).then(deleteStatus => {
    if (deleteStatus) {
      return res.redirect('/admin/products');
    }
    res.redirect('/');
  });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};
