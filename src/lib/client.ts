'use client';
export async function api<T>(url: string, method = 'GET', value?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: value ? { 'Content-Type': 'application/json' } : undefined,
      body: value ? JSON.stringify(value) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error(
      'Ekki náðist samband við vefþjón. Reyndu aftur; færslan hefur ekki verið staðfest.',
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Ekki náðist samband. Upplýsingarnar eru enn á skjánum.');
  }
  if (!response.ok) throw new Error(result.error ?? 'Aðgerð tókst ekki.');
  return result;
}
export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function storageConsent(owner: string) {
  try {
    return localStorage.getItem('hlyja-device-' + owner) === 'yes';
  } catch {
    return false;
  }
}
export function setStorageConsent(owner: string, allow: boolean) {
  try {
    localStorage.setItem('hlyja-device-' + owner, allow ? 'yes' : 'no');
  } catch {
    throw new Error(
      'Vafrinn leyfir ekki vistun tækjastillinga. Athugaðu geymsluheimildir vafrans.',
    );
  }
}
