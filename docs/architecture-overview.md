# Architecture Overview

## Current Repository Shape

This worktree currently contains:

- `frontend/`: Next.js admin and testing UI
- `backend/`: Express API, worker setup, LangGraph orchestration, analytics routes
- `packages/widget/`: embeddable React widget package added in this worktree
- `docs/`: implementation-aligned engineering and course documentation

The repository is not yet arranged as the final workspace layout from `PLAN.md`, so this document reflects the actual code structure rather than the target structure.

## Runtime Components

### Frontend

The `frontend/` app is a Next.js application used for admin-facing interaction and local validation. It already contains chat and analytics UI components that exercise the backend.

### Backend

The `backend/` service is an Express application with:

- `/chat` for streamed chat responses
- `/upload` for document ingestion
- `/analytics` for reporting
- LangGraph orchestration in `backend/src/agent.ts`
- BullMQ worker setup in `backend/src/workers/`

### Widget Package

The `packages/widget/` package is a publishable React package intended for third-party embedding into customer websites.

Its responsibilities are:

- accept a small public API surface
- fetch agent-specific widget config from the backend using `agentKey`
- establish an anonymous session id when no `customerId` is provided
- persist a browser-local `conversationId`
- render transcript, loading, error, disabled, and configuration-fallback states
- post chat traffic to `/api/v1/widget/chat`

## Boundary Decisions

The widget package intentionally avoids backend business logic. It assumes the backend will supply:

- a widget config endpoint
- a widget chat endpoint
- stable response formats for config and chat

Until those endpoints exist, the package remains integration-ready but cannot complete real widget chat end-to-end against the current backend without backend changes.
