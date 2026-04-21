# ER Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ ADMIN_USERS : has
    ORGANIZATIONS ||--o{ AGENTS : owns
    AGENTS ||--o{ ALLOWED_DOMAINS : restricts
    AGENTS ||--o{ DOCUMENTS : uses
    DOCUMENTS ||--o{ KNOWLEDGE_CHUNKS : produces
    AGENTS ||--o{ CONVERSATIONS : receives
    CONVERSATIONS ||--o{ MESSAGES : contains
    AGENTS ||--o{ ANALYTICS_LOGS : generates
    MAPPED_SUMMARIES ||--o{ DAILY_INSIGHTS : aggregates_into

    ORGANIZATIONS {
        uuid id PK
        string name
        string slug
        timestamptz created_at
        timestamptz updated_at
    }

    ADMIN_USERS {
        uuid id PK
        uuid org_id FK
        string email
        string password_hash
        string full_name
        string role
        timestamptz created_at
        timestamptz updated_at
    }

    AGENTS {
        uuid id PK
        uuid org_id FK
        string name
        string description
        string greeting_message
        string primary_color
        string launcher_position
        boolean is_active
        string system_prompt
        jsonb allowed_domains
        uuid public_api_key
        timestamptz created_at
        timestamptz updated_at
    }

    ALLOWED_DOMAINS {
        uuid id PK
        uuid agent_id FK
        string domain
        timestamptz created_at
    }

    DOCUMENTS {
        uuid id PK
        string company_id
        string agent_id
        string filename
        string mime_type
        string storage_path
        int size_bytes
        string status
        string processing_error
        timestamptz created_at
        timestamptz updated_at
    }

    KNOWLEDGE_CHUNKS {
        uuid id PK
        uuid doc_id FK
        string company_id
        string agent_id
        string chunk_index
        text content
        vector embedding
        jsonb metadata
    }

    CONVERSATIONS {
        uuid id PK
        string company_id
        string agent_id
        string source
        string session_id
        string customer_id
        timestamptz started_at
        timestamptz last_message_at
        timestamptz created_at
        timestamptz updated_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        string retrieval_strategy
        float confidence_score
        timestamptz created_at
    }

    ANALYTICS_LOGS {
        uuid id PK
        string company_id
        string agent_id
        string conversation_id
        string source
        string session_id
        text user_query
        text agent_response
        string retrieval_strategy
        float confidence_score
        boolean fallback_used
        timestamptz created_at
        boolean processed
    }

    MAPPED_SUMMARIES {
        uuid id PK
        timestamptz time_window
        jsonb friction_data
        timestamptz created_at
    }

    DAILY_INSIGHTS {
        uuid id PK
        date report_date
        jsonb top_issues
        float avg_sentiment
    }
```

## Notes
- `DOCUMENTS` and `KNOWLEDGE_CHUNKS` store the retrieval corpus.
- `CONVERSATIONS`, `MESSAGES`, and `ANALYTICS_LOGS` support analytics and auditability.
- `ALLOWED_DOMAINS` enforces widget usage restrictions for production websites.
