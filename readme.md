# RWAHub: Web3 Marketplace for Real-World Asset Tokenization

## Overview
RWAHub is a cutting-edge decentralized marketplace designed to bring real-world asset (RWA) tokenization into the Web3 era.
The platform empowers users to tokenize, fractionally own, and trade high-value assets — such as real estate, luxury watches, and fine jewelry — with ease and transparency.
By leveraging blockchain technology and smart contracts, RWAHub ensures secure, verifiable, and efficient transactions, making high-value investments accessible to everyone.

## Development Setup

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Quick Start
1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create local env** (required — frontend and backend will not start without `.env`)
   ```bash
   cp example.env .env
   ```
   Windows PowerShell: `Copy-Item example.env .env`
   Do not commit `.env`.

4. **Start development servers**
   ```bash
   npm run dev
   
5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Running tests
```bash
npm test
```
Runs the Jest/Supertest suite against the backend (`NODE_ENV=test`, rate limiting disabled, `--runInBand` so suites don't race for the mock in-memory DB).

## Docker

Two images are provided — the Express API and the built frontend (served by nginx, which also proxies `/api` to the backend) — since the backend does not serve the frontend build itself.

```bash
cp example.env .env           # first time only; any values work for a local run
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001 (also reachable through the frontend's `/api` proxy)

Override the host ports if either is already in use on your machine:
```bash
BACKEND_PORT=13001 FRONTEND_PORT=18080 docker compose up --build
```

Both containers run as non-root users, declare a `HEALTHCHECK` against `/api/health` (backend) and `/` (frontend), and take no secrets at build time — `docker-compose.yml` only points at `.env` via `env_file`, it never bakes values into the image. `.dockerignore` keeps `node_modules`, `.git`, `.env`, and build output out of the build context.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:
1. **build-and-test** — installs dependencies, runs `npm test`, builds the frontend (`npm run build`), and uploads the `dist/` output as a build artifact. Any failing step fails the job and is reported by GitHub Actions in the PR checks.
2. **docker-build** — builds both the backend and frontend Docker images (no registry push, so no credentials are required for this workflow) to catch Dockerfile breakage before merge.

## Troubleshooting & Security Notes

### Issues encountered and how they were resolved
- **`.env` was committed to git.** It only held placeholder values, but tracking a real env file is a bad habit. Removed it from tracking and added `.env` to `.gitignore` (previously only `.env.local`/`.env.*.local` were ignored).
- **No `test` script.** `jest`/`supertest` were installed but `package.json` had no `test` script. Added `"test": "cross-env NODE_ENV=test jest --runInBand"`.
- **Test suite was rate-limiting itself.** The global Express rate limiter (100 req / 15 min) throttled the Jest suite when run back-to-back, producing spurious 429s. Disabled the limiter when `NODE_ENV=test`.
- **`tests/api.test.js` had a broken import** (`require('../src/server')` instead of `require('../src/server/server')`), so that suite failed to load entirely. Fixed the path.
- **Jest was trying to run `src/types/test.ts` as a test file.** Scoped `testMatch` to `tests/**/*.test.js` in `package.json`.
- **Every test suite raced for port 3001** (`EADDRINUSE`). `server.js` called `app.listen()` unconditionally on module load, and each of the 4 test files `require()`s the server independently. Skipped `.listen()` under `NODE_ENV=test`; Supertest binds its own ephemeral port directly from the exported `app`.
- **`require-env.js`'s `.env`-file check failed inside containers.** Docker Compose injects env vars directly (`env_file`/`environment`), it doesn't write a `.env` file into the container filesystem, so the existing dev-convenience guard was blocking backend startup under Docker. Updated the check to skip when env vars are already present (`PORT` set, or `CI=true`), while still enforcing the `.env` file for plain local dev.
- **Known, not fixed (out of scope for this pass):** ~35 pre-existing test failures remain after the fixes above (`npm test` now passes 47/82, up from an effectively broken baseline). The root causes are application-level, not infra: the mock seed data in `src/server/models/database.js` doesn't include a user matching the credentials `tests/auth.test.js` expects to log in with, and a few `middleware.test.js` assertions expect response headers that aren't currently set. These would need a look at the seed data and middleware config, not the Docker/CI setup.

### Managing environment variables and secrets
- Local development: copy `example.env` → `.env` (gitignored, never committed). `example.env` stays as the safe, values-free template.
- Docker: values are supplied at `docker compose up` time via `env_file: .env`; nothing is baked into the image layers, so the same image can be promoted across environments by swapping the env file/vars.
- CI: GitHub Actions should store any real secrets (API keys, deploy credentials) in **repository/environment Secrets**, injected as `env:` on the relevant step — never committed, never printed in logs. This repo's CI only needs a throwaway `.env` copied from `example.env` since it doesn't talk to real external services.
- Production: use the platform's secret manager (e.g. AWS Secrets Manager/SSM Parameter Store, GCP Secret Manager, or the host platform's encrypted env vars) rather than files on disk; rotate `JWT_SECRET` and any real API keys independently of deploys.

### Monitoring and deployment failures
- Both containers expose a `HEALTHCHECK` (backend hits `/api/health`; frontend hits `/`), so `docker ps` / orchestrators (Compose, ECS, Kubernetes) can detect and restart an unhealthy container automatically (`restart: unless-stopped` is set for both services here).
- The `/api/health` endpoint is the natural target for uptime monitoring (e.g. an external pinger, or a Kubernetes liveness/readiness probe) and for a load balancer's health check.
- In CI, any failing step (install, test, build, Docker build) fails the workflow run and blocks the PR/merge — that's the first line of defense against shipping a broken deploy.
- For real deployments, I'd add: structured logging (the backend already uses `pino`) shipped to a log aggregator, basic request-latency/error-rate metrics, and a rollback plan (keep the previous image tagged and ready to redeploy if the health check fails post-deploy).

### 1. Asset Tokenization
**Purpose**: Converts physical assets into digital tokens on the blockchain.

**Process**:
- Asset owners submit ownership proof (e.g., deeds, certificates)
- Documentation verification process
- Smart contracts mint ERC-3643 tokens with verified metadata

**Benefit**: Ensures reliable asset digitization with blockchain verification.

### 2. Fractional Ownership
**Functionality**: Enables fractional investment in high-value assets.

**Implementation**:
- Token division based on asset value
- Automated ownership tracking via blockchain
- Fractional share management

**Benefit**: Makes high-value assets accessible to more investors.

### 3. Secure Marketplace
**Features**:
- Transparent price discovery
- Secure P2P transactions
- Real-time market data
- Smart contract-facilitated trades

**Benefit**: Creates an efficient, secure trading environment.

### 4. Robust Security
**Blockchain Integration**:
- Built on Ethereum/Polygon for scalability
- Transaction verification
- Automated compliance checks

**Smart Contracts**:
- Secure contract parameters
- Regular security audits
- Regulatory compliance

## Technical Architecture

### Blockchain Infrastructure
**Platform**: Ethereum/Polygon with Layer-2 optimization

**Smart Contracts**:
- Asset Tokenization Contract (ERC-721/ERC-1155)
- Marketplace Contract
- Escrow System

**Standards**:
- ERC-721 for unique assets
- ERC-1155 for fractionalized assets

### Frontend Architecture
**Framework**: 
- React.js with TypeScript
- TailwindCSS for responsive design
- Web3.js for blockchain interaction

**Features**:
- Asset marketplace dashboard
- Portfolio management
- Transaction history

### Backend Services
**Core Components**:
- Node.js/Express API server
- IPFS for decentralized storage

**Data Management**:
- MongoDB for market data
- Redis for caching

##  Solution

RWAHub introduces a full-stack tokenization protocol that enables:

- Asset verification and tokenization  
- Fractional ownership via blockchain tokens  
- Compliance-controlled transfers  
- Smart contract-based escrow settlement  
- Secondary marketplace trading  

Each token is backed by a verified real-world asset with enforceable compliance rules.

---

##  System Architecture

```txt
User Wallet
   │
Frontend (React / Web3)
   │
Backend API (Node.js)
   │
────────────────────────────
│                          │
KYC / AML           Blockchain Layer
│                   (Ethereum / Polygon)
│                          │
Compliance Engine   Smart Contracts
│                          │
───────────────┬────────────
               │
        Indexer Service
               │
     Off-chain State DB (MongoDB)
               │
           IPFS Storage
```

## Use Cases

### Real Estate
- Property tokenization
- Fractional ownership
- Automated rental distributions

### Luxury Goods
- Digital ownership certificates
- Transparent pricing
- Secure transfers

### Art & Collectibles
- Provenance tracking
- Fractional trading
- Portfolio management

## Roadmap

### Phase 1: Core Platform
- Smart contract deployment
- Basic marketplace features
- User authentication

### Phase 2: Enhanced Features
- Multi-chain support
- Advanced trading features
- Improved UI/UX

### Phase 3: Market Expansion
- Additional asset classes
- Enhanced security features
- Mobile application

### Phase 4: Ecosystem Growth
- Community governance
- Partnership integrations
- Market analytics




