const seenNonces = new Map();

const FRESHNESS_WINDOW_MS = 5 * 60 * 1000;

function isReplay(payLoad) {
    const { nonce, timestamp } = payLoad;

    if (!nonce || !timestamp) {
        return { isReplay: true, reason: ' Missing nonce or timestamp'};
    }

    const now = Date.now();
    const age = now - timestamp;

    if (age > FRESHNESS_WINDOW_MS) {
        return { isReplay: true, reason: `Payload is too old (${Math.round(age/1000)}s)`};
    }

    if (seenNonces.has(nonce)){
        return {isReplay: true, reason: 'Nonce has already been seen'};
    }

    seenNonces.set(nonce,now);

    return {isReplay: false, reason: null};
    
}

function cleanupOldNonces() {
    const now = Date.now();
    for (const [nonce,seenAt] of seenNonces.entries()) {
        if (now - seenAt > FRESHNESS_WINDOW_MS) {
            seenNonces.delete(nonce);
        }
    }
}

module.exports = { isReplay, cleanupOldNonces, seenNonces };