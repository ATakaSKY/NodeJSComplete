const mongoDb = require('mongodb');
const getDb = require('../util/connection').getDb;

const ObjectId = mongoDb.ObjectId;

class User {
  constructor(username, email, cart, id) {
    this.username = username;
    this.email = email;
    this.cart = cart;
    this._id = id;
  }

  save() {
    const db = getDb();
    db.collection('users')
      .insertOne(this)
      .then(result => console.log(result))
      .catch(err => console.log(err));
  }

  addToCart(product) {
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
        productId: new ObjectId(product._id),
        quantity: quantity
      });
    }

    const updatedCart = { items: updatedCartItems };

    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: updatedCart } }
      );
  }

  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map(p => {
      return p.productId;
    });

    return db
      .collection('products')
      .find({ _id: { $in: productIds } })
      .toArray()
      .then(products => {
        return products.map(p => {
          return {
            ...p,
            quantity: this.cart.items.find(i => {
              return i.productId.toString() === p._id.toString();
            }).quantity
          };
        });
      })
      .catch();
  }

  deleteProductFromUsersCart(prodId) {
    const updatedCartItems = this.cart.items.filter(p => {
      return prodId.toString() !== p.productId.toString();
    });
    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: updatedCartItems } } }
      );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then(products => {
        const order = {
          items: products,
          user: {
            _id: new ObjectId(this._id),
            name: this.username
          }
        };
        return db.collection('orders').insertOne(order);
      })
      .then(result => {
        return db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          );
      })
      .catch(err => console.log(err));
  }

  getOrders() {
    const db = getDb();
    return db
      .collection('orders')
      .find({ 'user._id': new ObjectId(this._id) })
      .toArray()
      .then(orders => {
        return orders;
      })
      .catch(err => console.log(err));
  }

  static fetchById(id) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new ObjectId(id) })
      .then(user => {
        console.log(user);
        return user;
      })
      .catch(err => console.log(err));
  }
}

module.exports = User;