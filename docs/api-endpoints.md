# API Endpoint Table

This table separates endpoints that exist in the current backend from widget endpoints that the new package assumes.

| Endpoint | Method | Status In Repo | Purpose | Request Notes | Response Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | `GET` | Implemented | Health check | None | Plain text status |
| `/upload` | `POST` | Implemented | Upload source documents | Multipart form data | Upload result payload |
| `/chat` | `POST` | Implemented | Existing streamed chat API used by current frontend | JSON body with `query` and `threadId` | `text/event-stream` with JSON `data:` events and `[DONE]` terminator |
| `/analytics` | `GET` | Implemented | Analytics retrieval | Query params depend on route implementation | JSON analytics payload |
| `/api/v1/widget/config` | `GET` | Required by widget, not yet implemented | Load widget configuration by public agent key | Query param: `agentKey` | JSON config with agent metadata, greeting, enabled flag, theme defaults |
| `/api/v1/widget/chat` | `POST` | Required by widget, not yet implemented | Process widget chat traffic | JSON body with `agentKey`, `conversationId`, `sessionId`, `message`, optional customer fields | JSON or SSE response containing assistant reply and optional `conversationId` |

## Suggested Widget Config Response

```json
{
  "agent": {
    "id": "agt_123",
    "name": "Echo Support"
  },
  "widget": {
    "greeting": "Hi, how can I help?",
    "primaryColor": "#0f766e",
    "position": "bottom-right",
    "isEnabled": true
  }
}
```

## Suggested Widget Chat Request

```json
{
  "agentKey": "agent_public_key",
  "conversationId": "conv_123",
  "sessionId": "anon_123",
  "customerId": "customer_123",
  "customerMetadata": {
    "plan": "pro"
  },
  "message": "How do I reset my password?"
}
```

## Suggested Widget Chat Response Options

### JSON

```json
{
  "conversationId": "conv_123",
  "reply": "Open the settings page and choose Reset password."
}
```

### SSE

The package also accepts `text/event-stream` responses where each event line contains JSON such as:

```txt
data: {"text":"Open the settings page"}

data: {"text":" and choose Reset password."}

data: [DONE]
```
