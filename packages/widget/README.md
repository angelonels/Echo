# `@echo/widget`

Embeddable React widget package for Echo.

## Public API

```tsx
import { EchoWidget } from "@echo/widget";

export function Example() {
  return (
    <EchoWidget
      agentKey="agent_public_key"
      apiBaseUrl="https://api.example.com"
      customerId="customer-123"
      customerMetadata={{ plan: "pro" }}
      theme={{
        primaryColor: "#0f766e",
        position: "bottom-right",
        greeting: "Hi there. Need help?",
      }}
    />
  );
}
```

The widget:

- loads widget config from `/api/v1/widget/config`
- persists anonymous session and conversation ids in local storage
- sends messages to `/api/v1/widget/chat`
- supports JSON and SSE-style chat responses
