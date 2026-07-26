const express = require('express');
const router = express.Router();
const { getSnapshot } = require('../metrics/counters');

router.get('/', (req, res) => {
  res.json(getSnapshot());
});

module.exports = router;