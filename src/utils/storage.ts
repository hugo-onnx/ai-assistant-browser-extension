const isExtension =
  typeof chrome !== "undefined" && chrome.storage !== undefined;

export async function getStorage(keys: string[]): Promise<Record<string, unknown>> {
  if (!isExtension) {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const val = localStorage.getItem(key);
      result[key] = val ? JSON.parse(val) : undefined;
    }
    return result;
  }
  return chrome.storage.local.get(keys);
}

export async function setStorage(data: Record<string, unknown>): Promise<void> {
  if (!isExtension) {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return;
  }
  return chrome.storage.local.set(data);
}

export async function getSyncStorage(keys: string[]): Promise<Record<string, unknown>> {
  if (!isExtension) {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const val = localStorage.getItem(`sync_${key}`);
      result[key] = val ? JSON.parse(val) : undefined;
    }
    return result;
  }
  return chrome.storage.sync.get(keys);
}

export async function setSyncStorage(data: Record<string, unknown>): Promise<void> {
  if (!isExtension) {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(`sync_${key}`, JSON.stringify(value));
    }
    return;
  }
  return chrome.storage.sync.set(data);
}