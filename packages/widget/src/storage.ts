const STORAGE_PREFIX = "echo-widget";

function isBrowser() {
  return typeof window !== "undefined";
}

export function buildStorageKey(scope: string, agentKey: string, customerKey: string) {
  return `${STORAGE_PREFIX}:${scope}:${agentKey}:${customerKey}`;
}

export function readStorage(key: string) {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore browser storage errors and continue in memory.
  }
}

export function generateClientId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
