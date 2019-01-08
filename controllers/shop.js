const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products'
    });
  });
};

exports.getProductsById = (req, res, next) => {
  console.log(req.params.productId);
  Product.fetchById(req.params.productId, product => {
    res.render('shop/product-detail', {
      path: '/products',
      pageTitle: product.title,
      product
    });
  });
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  });
};

exports.postProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.fetchById(prodId, product => {
    Cart.addProduct(prodId, product.price);
  });
  res.redirect('/cart');
};

exports.getCart = (req, res, next) => {
  Cart.getCart(cart => {
    Product.fetchAll(products => {
      const fetchProducts = [];
      for (product of products) {
        const foundProduct = cart.products.find(prod => prod.id === product.id);
        if (foundProduct) {
          fetchProducts.push({ productData: product, qty: foundProduct.qty });
        }
      }
      console.log(fetchProducts);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: fetchProducts
      });
    });
  });
};

exports.deleteProductFromCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.fetchById(productId, product => {
    Cart.deleteProductFromCart(productId, product.price);
    res.redirect('/cart');
  });
};

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
