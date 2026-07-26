const counters = {
  paymentsSettled: 0,
  paymentsRejectedReplay: 0,
  paymentsRejectedAuth: 0,
  paymentsRejectedRateLimit: 0,
  paymentsFailed: 0
};

function increment(counterName) {
  if (counters[counterName] === undefined) {
    console.warn(`Unknown counter: ${counterName}`);
    return;
  }
  counters[counterName]++;
}

function getSnapshot() {
  return { ...counters };
}

module.exports = { increment, getSnapshot };