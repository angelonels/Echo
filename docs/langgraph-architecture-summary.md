# LangGraph Architecture Summary

## Current Flow In Code

The existing backend chat route in `backend/src/routes/chat.ts` streams a request through the LangGraph workflow defined in `backend/src/agent.ts`.

Observed stages emitted by the route:

- `expanding`: query expansion / search query generation
- `retrieved`: retrieval result preview
- `grading`: context quality evaluation
- `generating`: final answer generation using the chat model

## Inferred Processing Sequence

1. Client sends `query` and `threadId`.
2. Express route calls `agentWorkflow.stream(...)`.
3. LangGraph emits intermediate nodes and retrieval diagnostics.
4. The route collects retrieved documents and grading state.
5. If retrieval quality is poor after retry loops, the route switches to a grounded fallback prompt.
6. `chatModel.stream(prompt)` generates the final response.
7. The route writes SSE chunks back to the client.
8. Analytics logging is queued asynchronously after response generation.

## Architectural Intent

The graph is serving as the orchestration layer between:

- user input
- retrieval expansion
- retrieval ranking and grading
- grounded generation
- analytics logging

For widget traffic, the recommended approach is to reuse the same LangGraph pipeline behind a dedicated widget-facing route rather than duplicating chat logic inside the package.
