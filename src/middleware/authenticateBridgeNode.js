const { verifyToken } = require('../auth/jwtHelper');

function authenticateBridgeNode(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const result = verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid or expired token', reason: result.reason });
  }

  req.bridgeNode = result.payload; 
  next();
}

module.exports = authenticateBridgeNode;