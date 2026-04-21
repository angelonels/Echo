const apiVersion = "/api/v1";

const apiRoutes = {
  base: apiVersion,
  health: `${apiVersion}/health`,
  chat: `${apiVersion}/chat`,
  upload: `${apiVersion}/documents/upload`,
  analyticsDaily: `${apiVersion}/analytics/daily`,
  analyticsTrigger: `${apiVersion}/analytics/trigger`,
} as const;

const fallbackBaseUrl = "http://localhost:3001/api/v1";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? fallbackBaseUrl;

export function buildApiUrl(route: keyof typeof apiRoutes) {
  const path = apiRoutes[route];
  return `${apiBaseUrl}${path.replace(apiRoutes.base, "")}`;
}
