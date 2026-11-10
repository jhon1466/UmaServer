import { createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import {
  Package,
  Star,
  Mail,
  Music,
  Award,
  Crown,
  Search,
  Sparkles,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-solid';
import {
  call,
  catalog,
  currentViewer,
  getIconUrl,
  notify,
} from '../../api';
import type { CatalogItem } from '../../types';

export default function ItemsExtrasPanel() {
  const [subTab, setSubTab] = createSignal<
    'items' | 'pieces' | 'mail' | 'music' | 'honors' | 'paid'
  >('items');

  // Items state
  const [ownedItems, setOwnedItems] = createSignal<Record<string, number>>({});
  const [itemSearch, setItemSearch] = createSignal('');
  const [itemGroup, setItemGroup] = createSignal('all');
  const [bulkCount, setBulkCount] = createSignal(999);

  // Star pieces & charas state
  const [charasData, setCharasData] = createSignal<any>({ charas: [], pieces: {}, epithets: {} });
  const [bulkLove, setBulkLove] = createSignal(1000);
  const [bulkFans, setBulkFans] = createSignal(1000000);
  const [bulkPiecesCount, setBulkPiecesCount] = createSignal(9999);

  // Mail / Present Box
  const [mailList, setMailList] = createSignal<any[]>([]);
  const [mailCategory, setMailCategory] = createSignal(90); // 90 = Carats
  const [mailItemId, setMailItemId] = createSignal(43);
  const [mailAmount, setMailAmount] = createSignal(1500);
  const [mailCopies, setMailCopies] = createSignal(1);
  const [mailMsg, setMailMsg] = createSignal('Regalo de la Academia Tracen');

  // Music
  const [musicData, setMusicData] = createSignal<{ songs: any[]; owned: number[] }>({
    songs: [],
    owned: [],
  });

  // Honors
  const [honorsOwned, setHonorsOwned] = createSignal<Record<string, string>>({});

  // Paid pass
  const [paidData, setPaidData] = createSignal<any | null>(null);
  const [paidDays, setPaidDays] = createSignal(365);

  async function refreshCurrentTab() {
    if (!currentViewer()) return;
    const t = subTab();
    try {
      if (t === 'items') {
        const res = await call<{ items: Record<string, number> }>('items.owned');
        setOwnedItems(res.items || {});
      } else if (t === 'pieces') {
        const res = await call<any>('charas.list');
        setCharasData(res);
      } else if (t === 'mail') {
        const res = await call<any[]>('mail.list');
        setMailList(res || []);
      } else if (t === 'music') {
        const res = await call<any>('music.list');
        setMusicData(res || { songs: [], owned: [] });
      } else if (t === 'honors') {
        const res = await call<{ owned: Record<string, string> }>('honors.list');
        setHonorsOwned(res.owned || {});
      } else if (t === 'paid') {
        const res = await call<any>('paid.list');
        setPaidData(res);
      }
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  createEffect(() => {
    if (currentViewer() && subTab()) {
      void refreshCurrentTab();
    }
  });

  const allItems = createMemo<CatalogItem[]>(() => catalog()?.items || []);

  const itemGroups = createMemo(() => {
    const groups = new Set<string>();
    for (const i of allItems()) if (i.group) groups.add(i.group);
    return Array.from(groups).sort();
  });

  const filteredItems = createMemo(() => {
    const q = itemSearch().trim().toLowerCase();
    const g = itemGroup();
    return allItems().filter((it) => {
      if (g !== 'all' && it.group !== g) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        (it.desc || '').toLowerCase().includes(q) ||
        String(it.id).includes(q)
      );
    });
  });

  async function setSingleItem(itemId: number, count: number) {
    try {
      await call('items.set', { changes: { [String(itemId)]: count } });
      setOwnedItems((p) => ({ ...p, [String(itemId)]: count }));
      notify(`Objeto #${itemId} actualizado a ×${count}`);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function bulkItems(action: 'give' | 'owned' | 'clear') {
    try {
      const grp = itemGroup() === 'all' ? '' : itemGroup();
      await call('items.bulk', { action, group: grp, count: bulkCount() });
      notify(`Operación en lote de inventario completada (${action})`);
      await refreshCurrentTab();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function giveAllStarPieces() {
    const changes: Record<string, number> = {};
    for (const u of catalog()?.umas?.cards || []) {
      if (u.piece_id) changes[String(u.piece_id)] = bulkPiecesCount();
    }
    try {
      await call('pieces.set', { changes });
      notify(`Todas las piezas estrella fijadas en ×${bulkPiecesCount()}`);
      await refreshCurrentTab();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function setAllCharasField(field: 'love_point' | 'fan', val: number) {
    const ids = Object.keys(catalog()?.misc?.charas || {}).map(Number);
    try {
      await call('charas.set', {
        field,
        value: val,
        ids,
        add_missing: true,
      });
      notify(`Actualizado ${field} en ${ids.length} personajes`);
      await refreshCurrentTab();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function sendMailPresent() {
    try {
      await call('mail.send', {
        category: mailCategory(),
        item_id: mailItemId(),
        num: mailAmount(),
        copies: mailCopies(),
        message: mailMsg(),
      });
      notify('Regalo enviado a la Caja de Regalos del jugador');
      await refreshCurrentTab();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="space-y-4">
      {/* Sub-navigation */}
      <div class="surface-card p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'items', label: 'Inventario de Objetos', icon: Package },
            { id: 'pieces', label: 'Piezas y Vínculos', icon: Star },
            { id: 'mail', label: 'Buzón de Regalos', icon: Mail },
            { id: 'music', label: 'Jukebox Musical', icon: Music },
            { id: 'honors', label: 'Títulos y Honores', icon: Award },
            { id: 'paid', label: 'Pases Premium', icon: Crown },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                  subTab() === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                onClick={() => setSubTab(tab.id as any)}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <button class="btn-subtle py-1.5 px-3 text-xs" onClick={refreshCurrentTab}>
          <RefreshCw size={14} /> Recargar
        </button>
      </div>

      {/* 1. Inventory Items */}
      <Show when={subTab() === 'items'}>
        <div class="space-y-4">
          <div class="surface-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div class="relative flex-1">
                <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  class="text-input pl-9 py-2 text-xs"
                  placeholder="Buscar objeto por nombre o ID..."
                  value={itemSearch()}
                  onInput={(e) => setItemSearch(e.currentTarget.value)}
                />
              </div>
              <select
                class="select-input !w-44 !py-2 text-xs"
                value={itemGroup()}
                onChange={(e) => setItemGroup(e.currentTarget.value)}
              >
                <option value="all">Todas las Categorías</option>
                <For each={itemGroups()}>{(g) => <option value={g}>{g}</option>}</For>
              </select>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999999"
                class="number-input !w-28 !py-1.5 text-xs"
                value={bulkCount()}
                onInput={(e) => setBulkCount(Number(e.currentTarget.value))}
              />
              <button class="btn-gold py-1.5 px-3 text-xs" onClick={() => bulkItems('give')}>
                <Sparkles size={14} /> Dar Todos ×{bulkCount()}
              </button>
              <button class="btn-danger py-1.5 px-3 text-xs" onClick={() => bulkItems('clear')}>
                <Trash2 size={14} /> Vaciar Grupo
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[650px] overflow-y-auto pr-1">
            <For each={filteredItems()}>
              {(it) => {
                const count = () => ownedItems()[String(it.id)] || 0;
                return (
                  <div class="item-row justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                      <img
                        src={getIconUrl('item', it.id)}
                        class="w-10 h-10 rounded-xl border border-white/10 bg-black/30 shrink-0"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.src = '/icon.png')}
                      />
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">{it.name}</div>
                        <div class="text-[10px] text-[var(--text-muted)] truncate">
                          ID #{it.id} · {it.group}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        class="number-input !w-20 !py-1 !px-2 text-xs text-center"
                        value={count()}
                        onChange={(e) => setSingleItem(it.id, Number(e.currentTarget.value))}
                      />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* 2. Star Pieces & Character Bonds */}
      <Show when={subTab() === 'pieces'}>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="surface-card p-5 space-y-4">
            <div>
              <span class="section-kicker">Piezas de Despertar</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Entrega Masiva de Piezas Estrella
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-1">
                Otorga piezas estrella a todas las Uma Musume del catálogo para subirlas a 5 estrellas dentro del juego.
              </p>
            </div>
            <div class="flex gap-2">
              <input
                type="number"
                class="number-input !w-36"
                value={bulkPiecesCount()}
                onInput={(e) => setBulkPiecesCount(Number(e.currentTarget.value))}
              />
              <button class="btn-gold flex-1" onClick={giveAllStarPieces}>
                <Sparkles size={15} /> Dar ×{bulkPiecesCount()} Piezas a Todas las Umas
              </button>
            </div>
          </div>

          <div class="surface-card p-5 space-y-4">
            <div>
              <span class="section-kicker">Vínculo de Personaje</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Afecto (Love Points) y Fans Globales
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-1">
                Desbloquea historias de personaje subiendo los puntos de afecto o incrementa el total de seguidores.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex gap-2">
                <input
                  type="number"
                  class="number-input flex-1 text-xs"
                  value={bulkLove()}
                  onInput={(e) => setBulkLove(Number(e.currentTarget.value))}
                />
                <button
                  class="btn-secondary px-3 text-xs"
                  onClick={() => setAllCharasField('love_point', bulkLove())}
                >
                  Fijar Afecto
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  type="number"
                  class="number-input flex-1 text-xs"
                  value={bulkFans()}
                  onInput={(e) => setBulkFans(Number(e.currentTarget.value))}
                />
                <button
                  class="btn-secondary px-3 text-xs"
                  onClick={() => setAllCharasField('fan', bulkFans())}
                >
                  Fijar Fans
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* 3. Present Box / Mail */}
      <Show when={subTab() === 'mail'}>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="lg:col-span-5 surface-card p-5 space-y-4">
            <div>
              <span class="section-kicker">Caja de Regalos</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">Enviar Correo / Regalo</h3>
            </div>
            <div class="space-y-3">
              <div>
                <label class="field-label">Categoría de Regalo</label>
                <select
                  class="select-input"
                  value={mailCategory()}
                  onChange={(e) => setMailCategory(Number(e.currentTarget.value))}
                >
                  <option value={90}>90 · Zanahorias (Carats)</option>
                  <option value={91}>91 · Objeto de Inventario</option>
                  <option value={51}>51 · Carta de Soporte</option>
                </select>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="field-label">ID Objeto</label>
                  <input
                    type="number"
                    class="number-input"
                    value={mailItemId()}
                    onInput={(e) => setMailItemId(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Cantidad</label>
                  <input
                    type="number"
                    class="number-input"
                    value={mailAmount()}
                    onInput={(e) => setMailAmount(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Copias</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    class="number-input"
                    value={mailCopies()}
                    onInput={(e) => setMailCopies(Number(e.currentTarget.value))}
                  />
                </div>
              </div>
              <div>
                <label class="field-label">Mensaje del Regalo</label>
                <input
                  type="text"
                  class="text-input"
                  value={mailMsg()}
                  onInput={(e) => setMailMsg(e.currentTarget.value)}
                />
              </div>
              <button class="btn-primary w-full py-2.5" onClick={sendMailPresent}>
                <Send size={15} /> Enviar al Buzón
              </button>
            </div>
          </div>

          <div class="lg:col-span-7 surface-card p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-extrabold text-white">
                Regalos en Buzón ({mailList().length})
              </h3>
              <button
                class="btn-danger py-1.5 px-3 text-xs"
                onClick={async () => {
                  await call('mail.clear', { all: true });
                  await refreshCurrentTab();
                }}
              >
                <Trash2 size={13} /> Vaciar Buzón Completo
              </button>
            </div>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <For each={mailList()}>
                {(m: any) => (
                  <div class="item-row justify-between">
                    <div>
                      <div class="text-xs font-bold text-white">
                        #{m.present_id} · Categoría {m.reward_type} · Item #{m.reward_id} ×{m.reward_count}
                      </div>
                      <div class="text-[10px] text-[var(--text-muted)]">
                        {m.state ? 'Reclamado' : 'Pendiente por reclamar'}
                      </div>
                    </div>
                    <button
                      class="btn-danger py-1 px-2.5 text-xs"
                      onClick={async () => {
                        await call('mail.delete', { ids: [m.present_id] });
                        await refreshCurrentTab();
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* 4. Jukebox / Concert Songs */}
      <Show when={subTab() === 'music'}>
        <div class="surface-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="section-kicker">Winning Live & Jukebox</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Canciones Desbloqueadas ({musicData().owned.length} / {musicData().songs.length})
              </h3>
            </div>
            <button
              class="btn-gold py-2 px-4 text-xs"
              onClick={async () => {
                await call('music.set', { action: 'give', all: true });
                notify('Todas las canciones del Jukebox desbloqueadas');
                await refreshCurrentTab();
              }}
            >
              <Sparkles size={14} /> Desbloquear Todas las Canciones
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto">
            <For each={musicData().songs}>
              {(s: any) => {
                const isOwned = () => musicData().owned.includes(s.id);
                return (
                  <div class="item-row justify-between">
                    <div class="min-w-0">
                      <div class="text-xs font-bold text-white truncate">{s.name}</div>
                      <div class="text-[10px] text-[var(--text-muted)]">Canción #{s.id}</div>
                    </div>
                    <button
                      class={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isOwned()
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/5 text-[var(--text-muted)] hover:text-white'
                      }`}
                      onClick={async () => {
                        await call('music.set', {
                          action: isOwned() ? 'remove' : 'give',
                          ids: [s.id],
                        });
                        await refreshCurrentTab();
                      }}
                    >
                      {isOwned() ? 'Desbloqueada' : 'Desbloquear'}
                    </button>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* 5. Honors / Titles */}
      <Show when={subTab() === 'honors'}>
        <div class="surface-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="section-kicker">Insignias de Entrenador</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Títulos y Honores ({Object.keys(honorsOwned()).length} /{' '}
                {(catalog()?.misc?.honors || []).length})
              </h3>
            </div>
            <button
              class="btn-gold py-2 px-4 text-xs"
              onClick={async () => {
                await call('honors.set', { action: 'give', all: true });
                notify('Todos los títulos de entrenador desbloqueados');
                await refreshCurrentTab();
              }}
            >
              <Sparkles size={14} /> Desbloquear Todos los Títulos
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto">
            <For each={catalog()?.misc?.honors || []}>
              {(h) => {
                const isOwned = () => Boolean(honorsOwned()[String(h.id)]);
                return (
                  <div class="item-row justify-between">
                    <div class="min-w-0">
                      <div class="text-xs font-bold text-white truncate">{h.name}</div>
                      <div class="text-[10px] text-[var(--text-muted)]">
                        ID #{h.id} · Rango {h.rank}
                      </div>
                    </div>
                    <button
                      class={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isOwned()
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/5 text-[var(--text-muted)] hover:text-white'
                      }`}
                      onClick={async () => {
                        await call('honors.set', {
                          action: isOwned() ? 'remove' : 'give',
                          ids: [h.id],
                        });
                        await refreshCurrentTab();
                      }}
                    >
                      {isOwned() ? 'Obtenido' : 'Otorgar'}
                    </button>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* 6. Paid Features Pass */}
      <Show when={subTab() === 'paid'}>
        <div class="surface-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="section-kicker">Suscripciones y Pases</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Funciones Premium y Pases Mensuales
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="36500"
                class="number-input !w-28 text-xs"
                value={paidDays()}
                onInput={(e) => setPaidDays(Number(e.currentTarget.value))}
              />
              <button
                class="btn-gold py-2 px-4 text-xs"
                onClick={async () => {
                  await call('paid.grant', { name: 'all', days: paidDays() });
                  notify(`Todos los pases premium activados por ${paidDays()} días`);
                  await refreshCurrentTab();
                }}
              >
                <Crown size={14} /> Activar Todos ({paidDays()} días)
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <For each={paidData()?.features || []}>
              {(f: any) => (
                <div class="item-row justify-between">
                  <div>
                    <div class="text-sm font-bold text-white">{f.name}</div>
                    <div class="text-xs text-[var(--text-muted)]">
                      {f.active ? `Activo hasta ${f.end}` : 'Inactivo'}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="btn-secondary py-1.5 px-3 text-xs"
                      onClick={async () => {
                        await call('paid.grant', { name: f.name, days: paidDays() });
                        await refreshCurrentTab();
                      }}
                    >
                      Activar
                    </button>
                    <Show when={f.active}>
                      <button
                        class="btn-danger py-1.5 px-3 text-xs"
                        onClick={async () => {
                          await call('paid.grant', { name: f.name, revoke: true });
                          await refreshCurrentTab();
                        }}
                      >
                        Revocar
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

