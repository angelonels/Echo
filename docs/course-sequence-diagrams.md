# Sequence Diagram Outlines

## 1. Widget Chat Flow

Actors:

- Website Visitor
- Host Website
- `@echo/widget`
- Echo API
- LangGraph Workflow
- Bedrock

Outline:

1. Visitor opens embedded widget.
2. Widget requests `/api/v1/widget/config` using `agentKey`.
3. API returns widget config and agent metadata.
4. Visitor sends a message.
5. Widget posts to `/api/v1/widget/chat` with session and conversation ids.
6. API invokes LangGraph workflow.
7. LangGraph retrieves context and generates an answer through Bedrock.
8. API streams or returns final response.
9. Widget appends assistant reply to transcript.

## 2. Admin Upload And Ingestion Flow

Actors:

- Company Admin
- Frontend
- Echo API
- Worker
- Postgres

Outline:

1. Admin uploads a document.
2. Frontend sends multipart request to `/upload`.
3. API stores document metadata and queues ingestion work.
4. Worker parses and chunks the document.
5. Worker stores processed artifacts and embeddings.
6. Agent becomes queryable for future chats.

## 3. Analytics Logging Flow

Actors:

- Client
- Echo API
- Analytics Queue
- Worker
- Postgres

Outline:

1. Client submits a chat request.
2. API generates a response.
3. API pushes analytics logging onto the queue.
4. Worker consumes the analytics job.
5. Worker stores event data for reporting.
