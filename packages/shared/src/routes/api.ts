const apiVersion = "/api/v1";

export const apiRoutes = {
  base: apiVersion,
  health: `${apiVersion}/health`,
  chat: `${apiVersion}/chat`,
  upload: `${apiVersion}/documents/upload`,
  analyticsDaily: `${apiVersion}/analytics/daily`,
  analyticsTrigger: `${apiVersion}/analytics/trigger`,
} as const;
