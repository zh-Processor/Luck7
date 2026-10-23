export function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ }
}

export async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  const succeeded = document.execCommand('copy');
  input.remove();
  if (!succeeded) throw new Error('复制失败，请手动复制。');
}
