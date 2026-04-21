# Use Case Diagram

```mermaid
flowchart TD
    company["Company Admin"]
    visitor["Website Visitor"]
    system["Echo Platform"]

    company --> uc1["Sign up / log in"]
    company --> uc2["Create agent"]
    company --> uc3["Update agent settings"]
    company --> uc4["Add or remove allowed domains"]
    company --> uc5["Upload support documents"]
    company --> uc6["Reindex document"]
    company --> uc7["Test agent in playground"]
    company --> uc8["Review analytics"]
    company --> uc9["View conversations"]
    company --> uc10["Get widget integration config"]

    visitor --> uc11["Open embedded widget"]
    visitor --> uc12["Ask support question"]

    uc5 --> system
    uc6 --> system
    uc7 --> system
    uc8 --> system
    uc9 --> system
    uc10 --> system
    uc11 --> system
    uc12 --> system

    system --> sub1["Store files locally"]
    system --> sub2["Run ingestion worker"]
    system --> sub3["Retrieve grounded context"]
    system --> sub4["Generate answer"]
    system --> sub5["Persist analytics"]
```

## Actors
- Company Admin: manages workspace, agents, knowledge base, analytics, and widget rollout.
- Website Visitor: interacts with the public support widget on the company website.

## Primary Use Cases
- Register and authenticate a company admin.
- Create and configure multiple support agents.
- Upload and reindex knowledge documents.
- Test support quality in the playground.
- Deploy an embeddable support widget.
- View analytics and past conversations.
- Receive grounded customer support answers from uploaded documents.
