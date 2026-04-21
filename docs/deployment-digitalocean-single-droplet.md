# Deployment Notes For A Single DigitalOcean Droplet

## Intended Runtime Topology

The project plan targets a single DigitalOcean droplet hosting backend infrastructure. Based on the current repo, the expected deployment shape is:

- `nginx` as reverse proxy and TLS termination
- `backend` API container
- worker processes for ingestion and analytics
- `postgres`
- `redis`

The frontend can remain on Vercel or another static/application host, while customer websites embed the widget package and call the droplet-hosted API directly.

## Practical Notes

- Expose the backend API over HTTPS because embedded widgets run on customer sites and will fail on mixed-content requests.
- Enable CORS for the customer origins allowed to host the widget.
- Serve widget endpoints under a stable versioned prefix such as `/api/v1/widget`.
- Persist Postgres and uploaded-file volumes on the droplet filesystem.
- Keep Redis internal to the droplet network.
- Route `/api/*` to the backend application through Nginx.

## Widget-Specific Deployment Considerations

- The `apiBaseUrl` passed into the widget should be the public backend origin, for example `https://echo-api.example.com`.
- Anonymous session and conversation identifiers are stored in the embedding browser, so no sticky sessions are required at the load balancer layer.
- If SSE is used for `/api/v1/widget/chat`, configure Nginx to avoid buffering streamed responses.

## Minimum Backend Support Needed

- `GET /api/v1/widget/config?agentKey=...`
- `POST /api/v1/widget/chat`
- CORS policy that allows expected embed origins
- public agent-key validation and disabled-agent handling
