# Mesh UPI Payments

A mesh-routed, offline-capable payment settlement system — a Node.js implementation of the "UPI without internet" concept, built with a stronger distributed-systems foundation : Redis-backed atomic idempotency, JWT-authenticated bridge nodes, per-node rate limiting, and Docker Compose for one-command local setup.

## The problem this solves

In areas with unreliable internet, a payment still needs a way to travel from sender to server. This project simulates that journey: a payment is encrypted on the sender's device, hops across one or more intermediary "bridge nodes" (devices that relay the payload without ever being able to read it), and is finally decrypted and settled once it reaches a server with real connectivity. The core engineering challenge isn't just encryption — it's making sure a payment that gets delivered by multiple bridge nodes (or replayed by an attacker) settles **exactly once**.

## Architecture

```
Sender's Device
      |
      | encrypts payment (RSA-OAEP wraps an AES-256-GCM key)
      v
Bridge Node A  ---forwards ciphertext blindly--->  Bridge Node B
                                                          |
                                                          v
                                                   Server (has private key)
                                                          |
                                    decrypts --> checks Redis for replay --> writes to Postgres
```

Bridge nodes physically carry the encrypted payload but structurally cannot read it — they never have access to the server's private key. Only the server can decrypt, and only after decrypting does it check whether this exact payment has already been settled.

## Key design decisions

- **Hybrid encryption (RSA-OAEP + AES-256-GCM):** RSA is slow and size-limited, so it's used only to wrap a randomly-generated AES key — never the actual payment data. AES-256-GCM handles the real payload and provides built-in tamper detection via its auth tag: if a bridge node (or an attacker) alters even one byte of the ciphertext in transit, decryption fails loudly instead of silently returning corrupted data.

- **Redis-based idempotency (`SET key value NX EX seconds`):** Duplicate-delivery protection needs to be atomic — a "check if seen, then mark as seen" done as two separate steps has a race-condition window where two simultaneous requests can both slip through. Redis's `SET ... NX` performs the check-and-set as a single, indivisible operation. A concurrency test (`src/scripts/concurrencyTest.js`) fires 5 simultaneous requests carrying the same nonce and confirms exactly one is ever allowed through, regardless of run order.

- **Two independent replay-detection layers:** the Redis check is the fast, primary defense; the database's `nonce @unique` constraint is a backup that catches anything that somehow slips past Redis (e.g., a Redis outage), returning a specific `P2002` error that the API handles gracefully rather than crashing.

- **JWT authentication for bridge nodes:** the original concept's ingest endpoint has no authentication at all. Here, every payment-creation request requires a valid, signed JWT — bridge nodes must first obtain a token (`POST /api/auth/token`), and the server verifies the signature (not just the payload) before accepting any relay.

- **Per-node rate limiting:** limits are tracked by the bridge node's identity (from its JWT), not by IP address — multiple bridge nodes in a real mesh network could plausibly share a network path, so identity-based limiting is more accurate than IP-based limiting for this use case.

- **Dual storage in Postgres (plaintext + encrypted):** the `Payment` table stores both human-readable fields (for the server's own operational use — status checks, admin views) and the full encrypted package (ciphertext, wrapped key, IV, auth tag) as a tamper-evident record of exactly what was transmitted. This mirrors how a real system would want both operability and an auditable original record.

## Setup

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) and Node.js installed.

```bash
git clone <your-repo-url>
cd mesh-upi-payments
npm install

# Start Postgres and Redis
docker compose up -d

# Generate the server's RSA key pair (creates server-public-key.pem / server-private-key.pem)
node src/crypto/generateServerKeys.js

# Apply the database schema
npx prisma migrate dev

# Copy .env.example to .env and fill in DATABASE_URL / JWT_SECRET
# (generate a random JWT secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

npm run dev
```

Server runs at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/token` | No | Issue a JWT for a bridge node (`{ "nodeId": "..." }`) |
| POST | `/api/payments/create` | Yes (Bearer JWT) | Encrypt and persist a new payment |
| GET | `/api/payments/:id` | No | Fetch a payment by ID |
| GET | `/api/metrics` | No | Operational counters (settled, rejected by reason, failed) |
| GET | `/health` | No | Basic health check |

## Demonstration scripts

Beyond the HTTP API, a few standalone scripts under `src/scripts/` demonstrate specific mechanisms in isolation:

- **`simulateMesh.js`** — runs a full payment through simulated bridge nodes to a server, printing each step, showing bridge nodes never touch plaintext.
- **`concurrencyTest.js`** — fires 5 simultaneous requests with an identical nonce directly against the Redis idempotency check, proving exactly one is ever allowed.
- **`testRedisReplay.js`** / **`testReplayFlow.js`** — smaller, focused tests of the replay-detection logic on its own.

## Tech stack

Node.js, Express, PostgreSQL, Prisma ORM (with `@prisma/adapter-pg`), Redis (`ioredis`), JWT (`jsonwebtoken`), `express-rate-limit`, Docker Compose.

## Limitations

- **Double-spend is detected, not prevented, at the offline stage.** If a sender's device is compromised and creates two conflicting offline payments before either reaches the server, this system will settle whichever arrives first and reject the second as a duplicate/conflict — it does not prevent the attempt itself while both parties are offline. This is an acknowledged limitation of the underlying concept, not something unique to this implementation.
- **In-memory metrics reset on server restart.** A production version would back the `/metrics` counters with Redis or a dedicated metrics/observability system rather than a plain in-process object.
- **`amount` is stored as `Float`.** For a real financial system, storing money as a floating-point type risks rounding errors; a production version should use a fixed-precision `Decimal` type or store amounts as integers in the smallest currency unit.
- **Token issuance has no real authentication step.** `POST /api/auth/token` issues a token to anyone who provides a `nodeId` — a production system would gate this behind actual bridge-node registration/authentication (e.g., a pre-shared certificate or registered device key).

## What I'd add with more time

- Prometheus-compatible metrics formatting for the `/metrics` endpoint
- A gossip-style routing protocol between bridge nodes instead of direct sequential relay
- Real bridge-node registration/authentication ahead of JWT issuance
- Integer-based (paise) or `Decimal`-typed amount storage
