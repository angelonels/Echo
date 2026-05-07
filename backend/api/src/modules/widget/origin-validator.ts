export function isOriginAllowed(origin: string | undefined, allowedDomains: string[]) {
  if (allowedDomains.length === 0) {
    return true;
  }

  if (!origin) {
    return false;
  }

  try {
    const host = new URL(origin).host.toLowerCase();
    return allowedDomains.some((domain) => normalizeDomain(domain) === host);
  } catch {
    return false;
  }
}

function normalizeDomain(domain: string) {
  const trimmed = domain.trim().toLowerCase();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return new URL(trimmed).host.toLowerCase();
  }

  return trimmed;
}
