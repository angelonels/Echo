# Echo

## Problem
Small and medium businesses often have only a marketing or product website and no dedicated customer support platform. They still need fast support, consistent answers, and a way to reuse existing documents such as policies, manuals, FAQs, and troubleshooting guides.

## Proposed Solution
Echo is a multi-tenant SaaS platform that lets a company create one or more customer support agents. Each agent is configured inside the Echo admin console, trained on uploaded documents, tested in a playground, monitored through analytics, and published through an embeddable React widget.

## Core Flow
1. A company signs up on Echo.
2. The company creates an agent for a support use case.
3. Documents are uploaded for that agent.
4. A background worker extracts text, semantically chunks content, generates embeddings, and stores vectors in PostgreSQL with `pgvector`.
5. During chat, the backend runs a deterministic retrieval workflow that chooses between naive retrieval, multi-query retrieval, or fallback.
6. The grounded answer is returned to the company dashboard playground or to the public website widget.
7. Chat logs and conversation history feed analytics such as fallback rate, average confidence, top questions, and sentiment-style summaries.

## Main Objectives
- Provide affordable support automation for small companies.
- Reduce hallucinated answers by grounding responses in uploaded documents.
- Support multiple agents per company.
- Keep deployment affordable by running on one DigitalOcean droplet for backend services.
- Expose a simple frontend integration path through a reusable widget package.

## Major Features
- Company signup and login
- Multi-agent management
- Document upload and asynchronous ingestion
- Vector search with deterministic LangGraph orchestration
- Playground chat for testing
- Widget-based website integration
- Analytics dashboard for support quality monitoring

## Tech Stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend API: Node.js, TypeScript, Express, Zod, bcrypt, JWT
- Worker: Node.js, TypeScript, BullMQ
- Database: PostgreSQL with `pgvector`
- Queue/Cache: Redis
- AI Models: AWS Bedrock
- Infra: Docker Compose, Nginx, DigitalOcean, Vercel

## Why This Idea Is Valuable
Echo turns existing company documents into a real support surface instead of requiring companies to build a custom support system from scratch. It is especially useful for businesses that want practical AI support without the cost or engineering overhead of a full internal platform.
