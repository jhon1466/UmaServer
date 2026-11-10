import { createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import {
  Search,
  Sparkles,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Layers,
  Users,
  Wand2,
  Bookmark,
  Upload,
  Eye,
} from 'lucide-solid';
import {
  call,
  catalog,
  currentViewer,
  getIconUrl,
  notify,
  loadCatalog,
} from '../../api';
import type { CatalogSupportCard, OwnedSupport } from '../../types';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  speed: { label: 'Velocidad', color: 'text-sky-300 border-sky-400/30 bg-sky-500/15' },
  stamina: { label: 'Resistencia', color: 'text-rose-300 border-rose-400/30 bg-rose-500/15' },
  power: { label: 'Potencia', color: 'text-amber-300 border-amber-400/30 bg-amber-500/15' },
  guts: { label: 'Coraje', color: 'text-pink-300 border-pink-400/30 bg-pink-500/15' },
  wiz: { label: 'Ingenio', color: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/15' },
  friend: { label: 'Amistad', color: 'text-yellow-300 border-yellow-400/30 bg-yellow-500/15' },
  group: { label: 'Grupo', color: 'text-purple-300 border-purple-400/30 bg-purple-500/15' },
  other: { label: 'Otro', color: 'text-slate-300 border-slate-400/30 bg-slate-500/15' },
};

const RARITY_LABELS: Record<number, { label: string; badge: string }> = {
  3: { label: 'SSR', badge: 'gold' },
  2: { label: 'SR', badge: 'sakura' },
  1: { label: 'R', badge: '' },
};

function DiamondRow(props: { lb: number; onSelect?: (n: number) => void }) {
  return (
    <div class="diamond-row">
      <For each={[1, 2, 3, 4]}>
        {(n) => (
          <div
            class={`diamond-pip ${n <= props.lb ? 'filled' : ''} ${
              props.onSelect ? 'cursor-pointer hover:scale-125 transition-transform' : ''
            }`}
            onClick={(e) => {
              if (props.onSelect) {
                e.stopPropagation();
                props.onSelect(props.lb === n ? n - 1 : n);
              }
            }}
          />
        )}
      </For>
    </div>
  );
}

export default function SupportsPanel(props: { initialTab?: 'catalog' | 'friends' | 'custom' } = {}) {
  const [subTab, setSubTab] = createSignal<'catalog' | 'friends' | 'custom'>(props.initialTab || 'catalog');
  const [ownedMap, setOwnedMap] = createSignal<Record<number, OwnedSupport>>({});
  const [search, setSearch] = createSignal('');
  const [filterType, setFilterType] = createSignal<string>('all');
  const [filterRarity, setFilterRarity] = createSignal<number>(0);
  const [filterOwned, setFilterOwned] = createSignal<'all' | 'owned' | 'missing'>('all');
  const [selectedCard, setSelectedCard] = createSignal<CatalogSupportCard | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Single card editor
  const [editLb, setEditLb] = createSignal(4);
  const [editLevel, setEditLevel] = createSignal(50);
  const [editStock, setEditStock] = createSignal(0);
  const [editFav, setEditFav] = createSignal(false);

  // Friends support state
  const [friendsList, setFriendsList] = createSignal<any[]>([]);
  const [friendCardId, setFriendCardId] = createSignal<number>(30028);
  const [friendLevel, setFriendLevel] = createSignal<number>(50);
  const [friendLb, setFriendLb] = createSignal<number>(4);
  const [friendName, setFriendName] = createSignal<string>('Amigo Tracen');

  // Custom support state
  const [customStatus, setCustomStatus] = createSignal<any | null>(null);
  const [donorId, setDonorId] = createSignal<number>(30028);
  const [customJson, setCustomJson] = createSignal<string>('');
  const [customVersion, setCustomVersion] = createSignal<number>(0);

  async function refreshOwned() {
    if (!currentViewer()) return;
    setLoading(true);
    try {
      const res = await call<{ cards: OwnedSupport[] }>('supports.owned');
      const map: Record<number, OwnedSupport> = {};
      for (const c of res.cards || []) map[c.id] = c;
      setOwnedMap(map);
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function refreshFriends() {
    if (!currentViewer()) return;
    try {
      const list = await call<any[]>('friends.list');
      setFriendsList(list || []);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function refreshCustom() {
    try {
      const st = await call<any>('custom_support.list', {}, { targetViewer: null });
      setCustomStatus(st);
      setCustomVersion(st?.version || 0);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  createEffect(() => {
    if (currentViewer()) {
      void refreshOwned();
      void refreshFriends();
    }
  });

  createEffect(() => {
    const onSubtab = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail;
      if (tab === 'custom') setSubTab('custom');
    };
    window.addEventListener('umaps:subtab', onSubtab);
    onCleanup(() => window.removeEventListener('umaps:subtab', onSubtab));
  });

  const allCards = createMemo<CatalogSupportCard[]>(() => catalog()?.supports?.cards || []);

  const filteredCards = createMemo(() => {
    const q = search().trim().toLowerCase();
    const t = filterType();
    const r = filterRarity();
    const o = filterOwned();
    const owned = ownedMap();

    return allCards().filter((c) => {
      const isOwned = Boolean(owned[c.id]);
      if (o === 'owned' && !isOwned) return false;
      if (o === 'missing' && isOwned) return false;
      if (t !== 'all' && c.type !== t) return false;
      if (r !== 0 && c.rarity !== r) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });
  });

  function selectSupport(card: CatalogSupportCard) {
    setSelectedCard(card);
    const owned = ownedMap()[card.id];
    const maxCap = catalog()?.supports?.limits?.[card.rarity]?.[owned?.lb ?? 4] || 50;
    setEditLb(owned ? owned.lb : 4);
    setEditLevel(owned ? owned.level : maxCap);
    setEditStock(owned ? owned.stock : 0);
    setEditFav(owned ? Boolean(owned.favorite) : false);
  }

  async function handleBulk(action: 'give' | 'max' | 'remove', onlyFiltered = false) {
    const list = onlyFiltered ? filteredCards() : allCards();
    const ids = list.map((c) => c.id);
    if (!ids.length) return;
    try {
      if (action === 'max') {
        await call('supports.apply', {
          action: 'set',
          ids,
          give_missing: true,
          lb: 4,
          level: 'max',
        });
        notify(`Maximizadas ${ids.length} cartas de soporte (MLB 4◆ · Nivel Máximo)`);
      } else if (action === 'give') {
        await call('supports.apply', { action: 'give', ids });
        notify(`Entregadas ${ids.length} cartas de soporte`);
      } else {
        await call('supports.apply', { action: 'remove', ids });
        notify(`Retiradas ${ids.length} cartas de soporte`);
      }
      await refreshOwned();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveSingleSupport() {
    const card = selectedCard();
    if (!card) return;
    try {
      await call('supports.apply', {
        action: 'set',
        ids: [card.id],
        give_missing: true,
        lb: editLb(),
        level: editLevel(),
        stock: editStock(),
        favorite: editFav() ? 1 : 0,
      });
      notify(`Actualizada carta #${card.id} (${card.name})`);
      await refreshOwned();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function removeSingleSupport() {
    const card = selectedCard();
    if (!card) return;
    try {
      await call('supports.apply', { action: 'remove', ids: [card.id] });
      notify(`Carta #${card.id} eliminada`);
      await refreshOwned();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function addFriendSupport() {
    try {
      await call('friends.add', {
        support_card_id: friendCardId(),
        level: friendLevel(),
        lb: friendLb(),
        name: friendName(),
      });
      notify(`Carta de amigo inyectada (#${friendCardId()})`);
      await refreshFriends();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function removeFriendIndex(idx: number) {
    try {
      await call('friends.remove', { indexes: [idx] });
      notify('Carta de amigo retirada');
      await refreshFriends();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function loadCustomTemplate() {
    try {
      const tpl = await call<any>('custom_support.template', { id: donorId() }, { targetViewer: null });
      setCustomJson(JSON.stringify(tpl, null, 2));
      notify(`Plantilla generada desde carta donante #${donorId()}`);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveCustomDraft() {
    try {
      const parsed = JSON.parse(customJson());
      const res = await call<any>(
        'custom_support.save',
        { definition: parsed, version: customVersion() },
        { targetViewer: null }
      );
      notify(`Borrador guardado para carta personalizada #${res?.id || parsed.id}`);
      await refreshCustom();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function publishCustom() {
    try {
      await call('custom_support.publish', {}, { targetViewer: null });
      notify('Cartas de soporte personalizadas publicadas en master.mdb');
      await refreshCustom();
      await loadCatalog();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="space-y-4">
      {/* Sub-navigation */}
      <div class="flex flex-wrap items-center justify-between gap-3 surface-card p-3.5">
        <div class="flex items-center gap-2">
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'catalog'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('catalog')}
          >
            <Layers size={15} /> Catálogo de Cartas ({Object.keys(ownedMap()).length}/{allCards().length})
          </button>
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'friends'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => {
              setSubTab('friends');
              void refreshFriends();
            }}
          >
            <Users size={15} /> Soportes de Amigo ({friendsList().length})
          </button>
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'custom'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => {
              setSubTab('custom');
              void refreshCustom();
            }}
          >
            <Wand2 size={15} /> Creador de Cartas Custom
          </button>
        </div>

        <Show when={subTab() === 'catalog'}>
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn-secondary py-1.5 px-3 text-xs" onClick={() => handleBulk('give', true)}>
              <Plus size={14} /> Obtener Filtradas
            </button>
            <button class="btn-gold py-1.5 px-3 text-xs" onClick={() => handleBulk('max', false)}>
              <Sparkles size={14} /> Maximizar Todas (MLB Nv.50)
            </button>
          </div>
        </Show>
      </div>

      {/* Sub-tab 1: Support Catalog */}
      <Show when={subTab() === 'catalog'}>
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div class="xl:col-span-7 space-y-3">
            <div class="surface-card p-4 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <div class="relative flex-1 min-w-[200px]">
                  <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    class="text-input pl-9 py-2 text-xs"
                    placeholder="Buscar soporte por nombre, título o ID (ej. Kitasan Black, 30028)..."
                    value={search()}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                  />
                </div>
                <select
                  class="select-input !w-36 !py-2 text-xs"
                  value={filterType()}
                  onChange={(e) => setFilterType(e.currentTarget.value)}
                >
                  <option value="all">Todos los Tipos</option>
                  <option value="speed">Velocidad</option>
                  <option value="stamina">Resistencia</option>
                  <option value="power">Potencia</option>
                  <option value="guts">Coraje</option>
                  <option value="wiz">Ingenio</option>
                  <option value="friend">Amistad</option>
                  <option value="group">Grupo</option>
                </select>
                <select
                  class="select-input !w-28 !py-2 text-xs"
                  value={filterRarity()}
                  onChange={(e) => setFilterRarity(Number(e.currentTarget.value))}
                >
                  <option value={0}>Rareza: Todas</option>
                  <option value={3}>SSR</option>
                  <option value={2}>SR</option>
                  <option value={1}>R</option>
                </select>
                <select
                  class="select-input !w-32 !py-2 text-xs"
                  value={filterOwned()}
                  onChange={(e) => setFilterOwned(e.currentTarget.value as any)}
                >
                  <option value="all">Estado: Todas</option>
                  <option value="owned">Obtenidas</option>
                  <option value="missing">Faltantes</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[650px] overflow-y-auto pr-1">
              <For each={filteredCards()}>
                {(card) => {
                  const owned = () => ownedMap()[card.id];
                  const tMeta = () => TYPE_LABELS[card.type] || TYPE_LABELS.other;
                  const rMeta = () => RARITY_LABELS[card.rarity] || RARITY_LABELS[1];
                  return (
                    <div
                      class={`item-row cursor-pointer ${
                        selectedCard()?.id === card.id ? 'selected' : ''
                      } ${!owned() ? 'opacity-65 hover:opacity-100' : ''}`}
                      onClick={() => selectSupport(card)}
                    >
                      <img
                        src={getIconUrl('support', card.id)}
                        alt={card.name}
                        class="w-12 h-12 rounded-xl object-cover border border-white/15 bg-black/40 shrink-0"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', card.chara_id); }}
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                          <span class="font-bold text-sm text-white truncate">{card.name}</span>
                          <span class={`tiny-chip ${rMeta().badge} text-[10px] py-0.5 px-1.5`}>
                            {rMeta().label}
                          </span>
                        </div>
                        <div class="text-xs text-[var(--text-muted)] truncate">{card.title}</div>
                        <div class="flex items-center justify-between mt-1.5">
                          <span
                            class={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tMeta().color}`}
                          >
                            {tMeta().label}
                          </span>
                          <Show
                            when={owned()}
                            fallback={<span class="text-[10px] text-[var(--text-muted)]">No obtenida</span>}
                          >
                            {(o) => (
                              <div class="flex items-center gap-2">
                                <DiamondRow lb={o().lb} />
                                <span class="text-xs font-extrabold text-emerald-300">
                                  Nv.{o().level}
                                </span>
                              </div>
                            )}
                          </Show>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Right column: Card Inspector */}
          <div class="xl:col-span-5">
            <Show
              when={selectedCard()}
              fallback={
                <div class="surface-card p-8 text-center space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto text-emerald-300">
                    <Layers size={24} />
                  </div>
                  <h4 class="text-base font-extrabold text-white">Editor de Carta de Soporte</h4>
                  <p class="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    Haz clic en cualquier carta para ajustar su ruptura de límite (0–4 diamantes), nivel de experiencia, copias en reserva o inyectarla como soporte de amigo.
                  </p>
                </div>
              }
            >
              {(card) => {
                const isOwned = () => Boolean(ownedMap()[card().id]);
                const maxCap = () =>
                  catalog()?.supports?.limits?.[card().rarity]?.[editLb()] || 50;
                return (
                  <div class="surface-card p-5 space-y-5">
                    <div class="flex items-start gap-4 border-b border-white/8 pb-4">
                      <img
                        src={getIconUrl('support', card().id)}
                        alt={card().name}
                        class="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/40 bg-black/40 shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', selectedCard()!.chara_id); }}
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="tiny-chip gold">
                            {RARITY_LABELS[card().rarity]?.label || 'R'}
                          </span>
                          <span class="tiny-chip">ID #{card().id}</span>
                          <span class="tiny-chip turf">
                            {TYPE_LABELS[card().type]?.label || card().type}
                          </span>
                        </div>
                        <h3 class="text-lg font-extrabold text-white mt-1 truncate">
                          {card().name}
                        </h3>
                        <p class="text-xs text-[var(--text-muted)] truncate">{card().title}</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="field-label">Ruptura de Límite (0–4◆)</label>
                        <div class="h-10 px-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                          <DiamondRow
                            lb={editLb()}
                            onSelect={(n) => {
                              setEditLb(n);
                              const cap =
                                catalog()?.supports?.limits?.[card().rarity]?.[n] || 50;
                              setEditLevel(cap);
                            }}
                          />
                          <span class="text-xs font-extrabold text-sky-300">LB {editLb()}</span>
                        </div>
                      </div>

                      <div>
                        <label class="field-label">Nivel (Máx. {maxCap()})</label>
                        <input
                          type="number"
                          min="1"
                          max={maxCap()}
                          class="number-input"
                          value={editLevel()}
                          onInput={(e) => setEditLevel(Number(e.currentTarget.value))}
                        />
                      </div>

                      <div>
                        <label class="field-label">Copias extra (Stock)</label>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          class="number-input"
                          value={editStock()}
                          onInput={(e) => setEditStock(Number(e.currentTarget.value))}
                        />
                      </div>

                      <div>
                        <label class="field-label">Favorita / Bloqueada</label>
                        <button
                          class={`w-full h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                            editFav()
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                              : 'bg-black/25 border-white/10 text-[var(--text-muted)]'
                          }`}
                          onClick={() => setEditFav(!editFav())}
                        >
                          <Bookmark size={14} /> {editFav() ? 'Marcada Favorita' : 'Sin marcar'}
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-2">
                      <button class="btn-primary flex-1 py-2.5" onClick={saveSingleSupport}>
                        <Check size={15} /> Guardar Carta
                      </button>
                      <button
                        class="btn-gold py-2.5 px-3.5 text-xs"
                        onClick={() => {
                          setEditLb(4);
                          const cap = catalog()?.supports?.limits?.[card().rarity]?.[4] || 50;
                          setEditLevel(cap);
                          void saveSingleSupport();
                        }}
                      >
                        <Sparkles size={14} /> MLB Máx.
                      </button>
                      <Show when={isOwned()}>
                        <button class="btn-danger py-2.5 px-3" onClick={removeSingleSupport}>
                          <Trash2 size={15} />
                        </button>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </Show>
          </div>
        </div>
      </Show>

      {/* Sub-tab 2: Friend Support Cards */}
      <Show when={subTab() === 'friends'}>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="lg:col-span-5 surface-card p-5 space-y-4">
            <div>
              <span class="section-kicker">Soporte Prestado en Carrera</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Inyectar Carta de Amigo
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-1">
                Fija qué cartas aparecen siempre al elegir el soporte de amigo antes de iniciar un entrenamiento.
              </p>
            </div>

            <div class="space-y-3">
              <div>
                <label class="field-label">Carta de Soporte</label>
                <select
                  class="select-input"
                  value={friendCardId()}
                  onChange={(e) => setFriendCardId(Number(e.currentTarget.value))}
                >
                  <For each={allCards()}>
                    {(c) => (
                      <option value={c.id}>
                        [{RARITY_LABELS[c.rarity]?.label}] {c.name} — {c.title} (#{c.id})
                      </option>
                    )}
                  </For>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="field-label">Nivel (1–50)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    class="number-input"
                    value={friendLevel()}
                    onInput={(e) => setFriendLevel(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Límite (0–4◆)</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    class="number-input"
                    value={friendLb()}
                    onInput={(e) => setFriendLb(Number(e.currentTarget.value))}
                  />
                </div>
              </div>
              <div>
                <label class="field-label">Nombre del Entrenador Amigo</label>
                <input
                  type="text"
                  class="text-input"
                  value={friendName()}
                  onInput={(e) => setFriendName(e.currentTarget.value)}
                />
              </div>
              <button class="btn-primary w-full py-2.5" onClick={addFriendSupport}>
                <Plus size={16} /> Añadir a la Lista de Amigos
              </button>
            </div>
          </div>

          <div class="lg:col-span-7 surface-card p-5 space-y-3">
            <h3 class="text-base font-extrabold text-white">
              Cartas de Amigo Activas ({friendsList().length})
            </h3>
            <Show
              when={friendsList().length > 0}
              fallback={
                <p class="text-xs text-[var(--text-muted)] py-8 text-center">
                  No hay cartas de amigo personalizadas inyectadas. El servidor generará amigos automáticos.
                </p>
              }
            >
              <div class="space-y-2">
                <For each={friendsList()}>
                  {(f) => (
                    <div class="item-row justify-between">
                      <div class="flex items-center gap-3">
                        <img
                          src={getIconUrl('support', f.support_card_id)}
                          class="w-11 h-11 rounded-xl border border-white/15"
                          onError={(e) => (e.currentTarget.src = '/icon.png')}
                        />
                        <div>
                          <div class="text-sm font-bold text-white">
                            {f.name || 'Amigo'} · Carta #{f.support_card_id}
                          </div>
                          <div class="text-xs text-[var(--text-muted)]">
                            LB {f.lb}◆ · EXP {f.exp}
                          </div>
                        </div>
                      </div>
                      <button
                        class="btn-danger py-1.5 px-3 text-xs"
                        onClick={() => removeFriendIndex(f.index)}
                      >
                        <Trash2 size={14} /> Quitar
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Sub-tab 3: Custom Support Authoring */}
      <Show when={subTab() === 'custom'}>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="lg:col-span-5 surface-card p-5 space-y-4">
            <div>
              <span class="section-kicker">Laboratorio de Cartas</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Creador de Cartas Custom
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-1">
                Clona cualquier carta del juego como plantilla, personaliza sus efectos y publícala en la base de datos local.
              </p>
            </div>

            <div class="space-y-3">
              <div>
                <label class="field-label">Carta Donante (Plantilla Base)</label>
                <select
                  class="select-input"
                  value={donorId()}
                  onChange={(e) => setDonorId(Number(e.currentTarget.value))}
                >
                  <For each={allCards()}>
                    {(c) => (
                      <option value={c.id}>
                        #{c.id} — {c.name} ({c.title})
                      </option>
                    )}
                  </For>
                </select>
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary flex-1 py-2 text-xs" onClick={loadCustomTemplate}>
                  <Eye size={14} /> Cargar Plantilla JSON
                </button>
                <button class="btn-gold flex-1 py-2 text-xs" onClick={publishCustom}>
                  <Upload size={14} /> Publicar en Juego
                </button>
              </div>
            </div>

            <div class="border-t border-white/8 pt-3 space-y-2">
              <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Cartas Custom Registradas ({(customStatus()?.cards || []).length})
              </div>
              <div class="space-y-1.5 max-h-60 overflow-y-auto">
                <For each={customStatus()?.cards || []}>
                  {(c: any) => (
                    <div class="flex items-center justify-between bg-black/25 border border-white/8 rounded-xl px-3 py-2">
                      <div>
                        <div class="text-xs font-bold text-white">
                          #{c.id} · {c.name || 'Custom Card'}
                        </div>
                        <div class="text-[10px] text-[var(--text-muted)]">
                          Donante #{c.art_donor} · Tipo {c.type}
                        </div>
                      </div>
                      <button
                        class="btn-subtle py-1 px-2.5 text-xs"
                        onClick={() => setCustomJson(JSON.stringify(c, null, 2))}
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 surface-card p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-extrabold text-white">Definición JSON de la Carta</h3>
              <button class="btn-primary py-1.5 px-4 text-xs" onClick={saveCustomDraft}>
                <Check size={14} /> Guardar Definición
              </button>
            </div>
            <textarea
              class="code-editor h-[420px]"
              placeholder='Haz clic en "Cargar Plantilla JSON" para generar una definición editable...'
              value={customJson()}
              onInput={(e) => setCustomJson(e.currentTarget.value)}
            />
          </div>
        </div>
      </Show>
    </div>
  );
}

