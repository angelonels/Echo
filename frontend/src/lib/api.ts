import { apiRoutes } from "@echo/shared";

const fallbackBaseUrl = "http://localhost:3001/api/v1";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? fallbackBaseUrl;

export function buildApiUrl(route: keyof typeof apiRoutes) {
  const path = apiRoutes[route];
  return `${apiBaseUrl}${path.replace(apiRoutes.base, "")}`;
}
