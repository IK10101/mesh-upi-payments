const express = require('express');
const router = express.Router();
const { createPayment, getPaymentById } = require('../services/paymentService');

router.post('/create', async (req, res) => {
  const { senderId, receiverId, amount } = req.body;

  if (!senderId || !receiverId || !amount) {
    return res.status(400).json({ error: 'senderId, receiverId, and amount are required' });
  }

  try {
    const result = await createPayment(senderId, receiverId, amount);

    if (!result.success) {
      return res.status(409).json({ error: result.reason });
    }

    res.status(201).json(result.payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;