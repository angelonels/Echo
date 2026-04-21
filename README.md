# Echo

This repository is organized as an `npm` workspaces monorepo aligned to the Echo system design:

- `frontend/`: Next.js landing page, auth flow, and admin product UI
- `backend/api/`: Express HTTP API
- `backend/worker/`: BullMQ worker process
- `packages/shared/`: shared routes, DTOs, Zod schemas, enums, and constants
- `packages/widget/`: embeddable React widget package
- `docs/`: architecture, deployment, integration, and course-support documentation

See `docs/README.md` for the documentation index.

## Prerequisites

- Node.js `20+`
- npm `10+`
- Docker and Docker Compose

## Install

```bash
npm install
```

## Local development

1. Copy `.env.example` to `.env` and fill in AWS Bedrock credentials if you want chat and embedding flows to work.
2. Start infrastructure:

```bash
docker compose up -d postgres redis
```

3. Start the workspace apps:

```bash
npm run dev
```

Default local endpoints:

- frontend: `http://localhost:3000`
- API health: `http://localhost:3001/api/v1/health`
- nginx proxy: `http://localhost:80/api/v1/health`

## Production-shaped droplet stack

The included `docker-compose.yml` is structured for a single DigitalOcean droplet and runs:

- `api`
- `worker`
- `postgres` with `pgvector`
- `redis`
- `nginx`

Bring it up with:

```bash
docker compose up --build -d
```

`nginx` proxies `/api/*` to the API service and exposes uploaded files from the shared uploads volume.

## Useful workspace commands

```bash
npm run build
npm run test
npm run dev:frontend
npm run dev:api
npm run dev:worker
```

## Notes

- Existing backend retrieval and analytics logic was preserved and split into dedicated API and worker services instead of being rewritten.
- File uploads now write to local disk under `UPLOAD_ROOT`, which matches the droplet storage constraint.
- The shared package is intentionally limited to transport-level contracts and constants, not domain business logic.
