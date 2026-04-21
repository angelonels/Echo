# ER Diagram Table List

This list is intentionally split between tables clearly implied by the current codebase and tables likely required for the planned product.

## Clearly Implied

- `agents`
- `documents`
- `conversations`
- `messages`
- `analytics_events`

## Very Likely Supporting Tables

- `companies`
- `users`
- `agent_widget_settings`
- `document_chunks`
- `ingestion_jobs`

## Notes For Course Deliverables

- `agent_widget_settings` is useful if widget branding, enabled state, greeting, and positioning are stored separately from the core agent row.
- `conversations` should relate to `agents` and optionally to an external `customer_id`.
- `messages` should relate to `conversations`.
- `analytics_events` can be stored either as raw events or as pre-aggregated rollup tables, depending on reporting needs.
