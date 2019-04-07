const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.auth = false;
    return next();
  } 
  // console.log(authHeader);
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'secretKey');
  } catch (err) {
    req.auth = false;
    return next();
  }
  if (!decodedToken) {
    req.auth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
