# Class Diagram Entity List

These are the main classes or conceptual entities that fit the current implementation and the new widget package.

## Backend / Domain

- `Agent`
- `Document`
- `Conversation`
- `Message`
- `AnalyticsEvent`
- `UploadJob`
- `RetrievalContext`
- `LangGraphWorkflow`
- `AnalyticsQueue`

## Widget Package

- `EchoWidget`
- `WidgetConfigResponse`
- `WidgetChatRequest`
- `WidgetChatResponse`
- `EchoWidgetMessage`
- `EchoWidgetTheme`

## Infrastructure / Support

- `PostgresStore`
- `RedisQueue`
- `BedrockChatModel`
- `NginxProxy`
