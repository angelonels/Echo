# Widget Integration Guide

## Install

When the package is published or linked locally:

```bash
npm install @echo/widget
```

## Use In A React Application

```tsx
import { EchoWidget } from "@echo/widget";

export default function App() {
  return (
    <EchoWidget
      agentKey="agent_public_key"
      apiBaseUrl="https://api.example.com"
      customerId="customer-123"
      customerMetadata={{ email: "user@example.com", plan: "pro" }}
      theme={{
        primaryColor: "#0f766e",
        position: "bottom-right",
        greeting: "Hi there. How can Echo help today?",
      }}
    />
  );
}
```

## Public Props

| Prop | Required | Type | Description |
| --- | --- | --- | --- |
| `agentKey` | Yes | `string` | Public key used to look up widget configuration |
| `apiBaseUrl` | Yes | `string` | Base URL for the Echo backend API |
| `customerId` | No | `string` | Stable customer identifier when the host app already knows the user |
| `customerMetadata` | No | `Record<string, unknown>` | Optional metadata forwarded with each chat request |
| `theme` | No | `{ primaryColor?, position?, greeting? }` | Optional host-side overrides for widget presentation |

## Runtime Behavior

1. The component fetches config from `/api/v1/widget/config?agentKey=...`.
2. If `customerId` is missing, the component generates an anonymous session id and stores it in local storage.
3. The component loads or creates a persistent `conversationId` in local storage.
4. Each new message posts to `/api/v1/widget/chat`.
5. The transcript remains in component state for the current page session, while conversation identity persists locally.

## Backend Expectations

The current backend in this repo does not yet expose the required widget routes. To integrate the package successfully, backend work must provide:

- public agent-key lookup
- disabled-agent handling
- widget-safe chat route
- response format compatible with JSON or SSE chunked text

## Local Storage Keys

The package uses agent-scoped keys in this shape:

- `echo-widget:session:<agentKey>:<customerKey>`
- `echo-widget:conversation:<agentKey>:<customerKey>`
