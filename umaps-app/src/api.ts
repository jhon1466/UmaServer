import { createSignal } from 'solid-js';
import type {
  Region,
  Language,
  UserSummary,
  UserDetail,
  CatalogCore,
  CatalogSkill,
  CatalogFactor,
  OwnedUma,
  OwnedSupport,
  VeteranSummary,
  CareerState,
  TuningKnob,
  HistoryRow,
} from './types';

export const [language, setLanguageSignal] = createSignal<Language>(
  (typeof localStorage !== 'undefined' && (localStorage.getItem('umaps.lang') as Language)) || 'es'
);
export const [region, setRegionSignal] = createSignal<Region>(
  (typeof localStorage !== 'undefined' && (localStorage.getItem('umaps.region') as Region)) || 'global'
);
export const [serverUrl, setServerUrlSignal] = createSignal<string>(
  (typeof localStorage !== 'undefined' && localStorage.getItem('umaps.server_url')) || 'http://127.0.0.1:8189'
);
export const [currentViewer, setCurrentViewerSignal] = createSignal<string>(
  (typeof localStorage !== 'undefined' && localStorage.getItem('umaps.viewer')) || ''
);
export const [connected, setConnected] = createSignal<boolean>(false);
export const [busy, setBusy] = createSignal<boolean>(false);
export const [lastAction, setLastAction] = createSignal<string>('');
export const [usersList, setUsersList] = createSignal<UserSummary[]>([]);
export const [catalog, setCatalog] = createSignal<CatalogCore | null>(null);
export const [skillsCatalog, setSkillsCatalog] = createSignal<CatalogSkill[]>([]);
export const [factorsCatalog, setFactorsCatalog] = createSignal<CatalogFactor[]>([]);
export const [notice, setNotice] = createSignal<{ text: string; error?: boolean } | null>(null);

let noticeTimer: number | undefined;

export function notify(text: string, error = false) {
  setNotice({ text, error });
  if (!error) setLastAction(text);
  if (typeof window !== 'undefined') {
    if (noticeTimer) window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => setNotice(null), 4600);
  }
}

export function setLanguage(next: Language) {
  setLanguageSignal(next);
  if (typeof localStorage !== 'undefined') localStorage.setItem('umaps.lang', next);
}

export function setRegion(next: Region) {
  setRegionSignal(next);
  if (typeof localStorage !== 'undefined') localStorage.setItem('umaps.region', next);
  const targetPort = next === 'jp' ? '8190' : '8189';
  const nextUrl = `http://127.0.0.1:${targetPort}`;
  setServerUrlSignal(nextUrl);
  if (typeof localStorage !== 'undefined') localStorage.setItem('umaps.server_url', nextUrl);
  void refreshAll();
}

export function selectViewer(vid: string) {
  setCurrentViewerSignal(vid);
  if (typeof localStorage !== 'undefined') localStorage.setItem('umaps.viewer', vid);
}

export function getIconUrl(kind: string, id?: number | string | null): string {
  if (!id) return '/icon.png';
  return `${serverUrl()}/icons/${kind}/${id}?v=2`;
}

export const APT_GRADE_LABELS: Record<number, string> = {
  1: 'G',
  2: 'F',
  3: 'E',
  4: 'D',
  5: 'C',
  6: 'B',
  7: 'A',
  8: 'S',
};

export function aptLabel(val: number): string {
  return APT_GRADE_LABELS[val] || 'G';
}

export async function call<T = any>(
  op: string,
  args: Record<string, any> = {},
  opts: { targetRegion?: Region; targetViewer?: string | null } = {}
): Promise<T> {
  const reg = opts.targetRegion || region();
  const viewer = opts.targetViewer !== undefined ? opts.targetViewer : currentViewer() || null;

  let res: Response;
  try {
    res = await fetch(`${serverUrl()}/api/${reg}/${op}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        viewer,
        args: { ...args, _prefer_english: true },
      }),
    });
  } catch (err: any) {
    setConnected(false);
    throw new Error('Servidor API desconectado. Inícialo desde la pestaña Servidor Local.');
  }

  setConnected(true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data.result as T;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${serverUrl()}/api/status`, { method: 'GET' });
    const ok = res.ok;
    setConnected(ok);
    return ok;
  } catch {
    setConnected(false);
    return false;
  }
}

export async function loadUsers(): Promise<UserSummary[]> {
  try {
    const res = await call<{ region: string; default: string; users: UserSummary[] }>(
      'users.list',
      {},
      { targetViewer: null }
    );
    const list = res?.users || [];
    setUsersList(list);
    if (!currentViewer() || !list.some((u) => u.id === currentViewer())) {
      const pick = list[0]?.id || res?.default || '';
      if (pick) selectViewer(pick);
    }
    return list;
  } catch {
    return [];
  }
}

export async function loadCatalog(): Promise<CatalogCore | null> {
  try {
    const res = await call<CatalogCore>('catalog.core', {}, { targetViewer: null });
    setCatalog(res);
    return res;
  } catch {
    return null;
  }
}

export async function ensureSkillsCatalog(): Promise<CatalogSkill[]> {
  if (skillsCatalog().length > 0) return skillsCatalog();
  try {
    const res = await call<CatalogSkill[]>('catalog.skills', {}, { targetViewer: null });
    setSkillsCatalog(res || []);
    return res || [];
  } catch {
    return [];
  }
}

export async function ensureFactorsCatalog(): Promise<CatalogFactor[]> {
  if (factorsCatalog().length > 0) return factorsCatalog();
  try {
    const res = await call<CatalogFactor[]>('catalog.factors', {}, { targetViewer: null });
    setFactorsCatalog(res || []);
    return res || [];
  } catch {
    return [];
  }
}

export async function refreshAll() {
  const ok = await checkConnection();
  if (ok) {
    await Promise.all([loadUsers(), loadCatalog()]);
  }
}
