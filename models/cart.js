const fs = require('fs');
const path = require('path');

const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'cart.json'
);

module.exports = class Cart {
  static addProduct(id, productPrice) {
    // Fetch the previous cart
    fs.readFile(p, (err, fileContent) => {
      let cart = { products: [], totalPrice: 0 };
      if (!err) {
        cart = JSON.parse(fileContent);
      }
      // Analyze the cart => Find existing product
      const existingProductIndex = cart.products.findIndex(
        prod => prod.id === id
      );
      const existingProduct = cart.products[existingProductIndex];
      let updatedProduct;
      // Add new product/ increase quantity
      if (existingProduct) {
        updatedProduct = { ...existingProduct };
        updatedProduct.qty = updatedProduct.qty + 1;
        cart.products = [...cart.products];
        cart.products[existingProductIndex] = updatedProduct;
      } else {
        updatedProduct = { id: id, qty: 1 };
        cart.products = [...cart.products, updatedProduct];
      }
      cart.totalPrice = cart.totalPrice + +productPrice;
      fs.writeFile(p, JSON.stringify(cart), err => {
        console.log(err);
      });
    });
  }

  static deleteProductFromCart(id, price) {
    fs.readFile(p, (err, fileContent) => {
      if (!err) {
        const cartProducts = { ...JSON.parse(fileContent) };
        const productToDelete = cartProducts.products.find(
          prod => prod.id === id
        );
        if (!productToDelete) {
          return;
        }
        const productQty = productToDelete.qty;
        cartProducts.products = cartProducts.products.filter(
          prod => prod.id !== id
        );
        cartProducts.totalPrice = cartProducts.totalPrice - productQty * price;
        fs.writeFile(p, JSON.stringify(cartProducts), err => {
          console.log(err);
        });
      }
    });
  }

  static getCart(cb) {
    fs.readFile(p, (err, fileContent) => {
      const data = JSON.parse(fileContent);
      if (err) {
        cb(null);
      } else {
        cb(data);
      }
    });
  }
};
