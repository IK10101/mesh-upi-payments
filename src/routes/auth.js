const express = require('express');
const router = express.Router();
const { generateToken } = require('../auth/jwtHelper');

router.post('/token', (req, res) => {
  const { nodeId } = req.body;

  if (!nodeId) {
    return res.status(400).json({ error: 'nodeId is required' });
  }

  const token = generateToken(nodeId);
  res.json({ token });
});

module.exports = router;