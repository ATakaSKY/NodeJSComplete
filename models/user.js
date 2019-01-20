const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Product'
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});

userSchema.methods.addToCart = function(product) {
  const productIndex = this.cart.items.findIndex(
    prod => product._id.toString() === prod.productId.toString()
  );

  let quantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (productIndex >= 0) {
    quantity = this.cart.items[productIndex].quantity + 1;
    updatedCartItems[productIndex].quantity = quantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: quantity
    });
  }

  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.deleteProductFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(p => {
    return productId.toString() !== p.productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
