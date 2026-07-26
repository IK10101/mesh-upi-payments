const { verifyToken } = require('../auth/jwtHelper');
const { increment } = require('../metrics/counters');

function authenticateBridgeNode(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    increment('paymentsRejectedAuth');
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const result = verifyToken(token);

  if (!result.valid) {
    increment('paymentsRejectedAuth');
    return res.status(401).json({ error: 'Invalid or expired token', reason: result.reason });
  }

  req.bridgeNode = result.payload;
  next();
}

module.exports = authenticateBridgeNode;