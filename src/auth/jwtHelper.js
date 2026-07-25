const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(nodeId) {
  return jwt.sign(
    { nodeId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function verifyToken(token) {
  try {
    return { valid: true, payload: jwt.verify(token, JWT_SECRET) };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

module.exports = { generateToken, verifyToken };