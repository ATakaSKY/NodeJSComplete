const MongoClient = require('mongodb').MongoClient;

let _db;

const connectMongo = callback => {
  MongoClient.connect(
    `mongodb+srv://sky:sky1234@cluster0-ftnod.mongodb.net/shop?retryWrites=true`
  )
    .then(client => {
      console.log('Connected');
      callback();
      _db = client.db();
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found';
};

exports.connectMongo = connectMongo;
exports.getDb = getDb;
