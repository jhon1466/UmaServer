import { createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import {
  Search,
  Sparkles,
  Check,
  X,
  Trash2,
  Plus,
  RefreshCw,
  Award,
  Heart,
  Users,
  ShieldAlert,
} from 'lucide-solid';
import {
  call,
  catalog,
  currentViewer,
  getIconUrl,
  aptLabel,
  notify,
} from '../../api';
import type { CatalogUmaCard, OwnedUma } from '../../types';

const APT_NAMES = [
  'Césped',
  'Tierra',
  'Sprint',
  'Milla',
  'Medio',
  'Largo',
  'Fuga',
  'Líder',
  'Entre',
  'Cierre',
];

const TALENT_NAMES = ['VEL', 'RES', 'POT', 'COR', 'INT'];

function StarRow(props: { count: number; max?: number; onSelect?: (n: number) => void }) {
  const max = () => props.max || 5;
  return (
    <div class="star-row">
      <For each={Array.from({ length: max() }, (_, i) => i + 1)}>
        {(n) => (
          <svg
            viewBox="0 0 24 24"
            class={`star-svg ${n <= props.count ? 'filled' : ''} ${props.onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={(e) => {
              if (props.onSelect) {
                e.stopPropagation();
                props.onSelect(n);
              }
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </For>
    </div>
  );
}

export default function UmasPanel() {
  const [ownedMap, setOwnedMap] = createSignal<Record<number, OwnedUma>>({});
  const [piecesMap, setPiecesMap] = createSignal<Record<number, number>>({});
  const [search, setSearch] = createSignal('');
  const [filterOwned, setFilterOwned] = createSignal<'all' | 'owned' | 'missing'>('all');
  const [selectedId, setSelectedId] = createSignal<number | null>(null);
  const [detail, setDetail] = createSignal<any | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Editor state
  const [editRarity, setEditRarity] = createSignal(3);
  const [editTalent, setEditTalent] = createSignal(5);
  const [editPieces, setEditPieces] = createSignal(0);
  const [editLove, setEditLove] = createSignal(0);
  const [editFans, setEditFans] = createSignal(1);
  const [editSkills, setEditSkills] = createSignal<{ skill_id: number; name: string; need_rank: number; level: number }[]>([]);

  async function refreshOwned() {
    const vid = currentViewer();
    if (!vid) return;
    setLoading(true);
    try {
      const res = await call<{
        cards: OwnedUma[];
        pieces: Record<number, number>;
      }>('umas.owned');
      const map: Record<number, OwnedUma> = {};
      for (const c of res.cards || []) map[c.id] = c;
      setOwnedMap(map);
      setPiecesMap(res.pieces || {});
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(cardId: number) {
    setSelectedId(cardId);
    try {
      const d = await call<any>('umas.detail', { card_id: cardId });
      setDetail(d);
      const entry = d.entry || {};
      const meta = d.card || {};
      setEditRarity(entry.rarity || meta.default_rarity || 3);
      setEditTalent(entry.talent_level || 1);
      setEditPieces(d.pieces || 0);
      setEditLove(d.chara?.love_point || 0);
      setEditFans(d.chara?.fan || 1);
      setEditSkills(
        (d.skills || []).map((s: any) => ({
          skill_id: s.skill_id,
          name: s.name,
          need_rank: s.need_rank,
          level: s.level || 0,
        }))
      );
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  createEffect(() => {
    if (currentViewer()) {
      void refreshOwned();
    }
  });

  const allCards = createMemo<CatalogUmaCard[]>(() => catalog()?.umas?.cards || []);

  const filteredCards = createMemo(() => {
    const q = search().trim().toLowerCase();
    const f = filterOwned();
    const owned = ownedMap();
    return allCards().filter((c) => {
      const isOwned = Boolean(owned[c.id]);
      if (f === 'owned' && !isOwned) return false;
      if (f === 'missing' && isOwned) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });
  });

  async function handleBulkAction(action: 'give' | 'set' | 'remove', mode?: 'max' | 'filtered') {
    const targetCards = mode === 'filtered' ? filteredCards() : allCards();
    const ids = targetCards.map((c) => c.id);
    if (ids.length === 0) return;
    try {
      if (action === 'set' && mode === 'max') {
        await call('umas.apply', {
          action: 'set',
          ids,
          give_missing: true,
          rarity: 'max',
          talent: 'max',
          hints: 'max',
          all_skills: true,
        });
        notify(`Desbloqueadas y maximizadas ${ids.length} Uma Musume (5★ · Potencial 5 · Pistas Máx.)`);
      } else if (action === 'give') {
        await call('umas.apply', { action: 'give', ids });
        notify(`Entregadas ${ids.length} Uma Musume al establo`);
      } else if (action === 'remove') {
        await call('umas.apply', { action: 'remove', ids });
        notify(`Eliminadas ${ids.length} Uma Musume`);
      }
      await refreshOwned();
      if (selectedId()) await loadDetail(selectedId()!);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveSingleUma() {
    const cid = selectedId();
    if (!cid) return;
    try {
      await call('umas.save', {
        card_id: cid,
        rarity: editRarity(),
        talent_level: editTalent(),
        pieces: editPieces(),
        chara: {
          love_point: editLove(),
          fan: editFans(),
        },
        skills: editSkills().filter((s) => s.level > 0),
      });
      notify(`Guardada configuración de Uma #${cid}`);
      await refreshOwned();
      await loadDetail(cid);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function quickMaxSingle(cid: number) {
    try {
      await call('umas.apply', {
        action: 'set',
        ids: [cid],
        give_missing: true,
        rarity: 'max',
        talent: 'max',
        hints: 'max',
        all_skills: true,
      });
      notify(`Maximizada Uma #${cid}`);
      await refreshOwned();
      await loadDetail(cid);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function removeSingle(cid: number) {
    try {
      await call('umas.apply', { action: 'remove', ids: [cid] });
      notify(`Uma #${cid} retirada de la colección`);
      await refreshOwned();
      await loadDetail(cid);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="uma-screen grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      {/* Left column: Catalog & Bulk toolbar */}
      <div class="xl:col-span-8 space-y-3">
        <div class="uma-catalog-toolbar surface-card p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="game-eyebrow">TRACEN ACADEMY · UMA COLLECTION</span>
              <h3 class="text-lg font-extrabold text-white mt-0.5">
                Catálogo de Uma Musume ({Object.keys(ownedMap()).length} / {allCards().length})
              </h3>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                class="btn-secondary py-1.5 px-3 text-xs"
                onClick={() => handleBulkAction('give')}
              >
                <Plus size={14} /> Desbloquear Todas
              </button>
              <button
                class="btn-gold py-1.5 px-3 text-xs"
                onClick={() => handleBulkAction('set', 'max')}
              >
                <Sparkles size={14} /> Maximizar Todas (5★ Lv5)
              </button>
              <button
                class="btn-subtle py-1.5 px-2.5 text-xs"
                onClick={refreshOwned}
                title="Recargar"
              >
                <RefreshCw size={14} class={loading() ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <div class="relative flex-1 min-w-[220px]">
              <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                class="text-input pl-9 py-2 text-xs"
                placeholder="Buscar por nombre, atuendo o ID (ej. Oguri Cap, 100601)..."
                value={search()}
                onInput={(e) => setSearch(e.currentTarget.value)}
              />
            </div>
            <div class="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/8">
              <button
                class={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterOwned() === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                onClick={() => setFilterOwned('all')}
              >
                Todas ({allCards().length})
              </button>
              <button
                class={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterOwned() === 'owned'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                onClick={() => setFilterOwned('owned')}
              >
                Obtenidas ({Object.keys(ownedMap()).length})
              </button>
              <button
                class={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterOwned() === 'missing'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                onClick={() => setFilterOwned('missing')}
              >
                Faltantes ({allCards().length - Object.keys(ownedMap()).length})
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Uma Cards */}
        <div class="uma-card-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          <For each={filteredCards()}>
            {(card) => {
              const owned = () => ownedMap()[card.id];
              const isSelected = () => selectedId() === card.id;
              return (
                <div
                  class={`uma-game-card cursor-pointer ${isSelected() ? 'selected' : ''} ${!owned() ? 'unowned' : ''}`}
                  onClick={() => loadDetail(card.id)}
                >
                  <img
                    src={getIconUrl('card', card.id)}
                    alt={card.name}
                    class={`uma-card-art rarity-${card.default_rarity}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getIconUrl('chara', card.chara_id);
                    }}
                  />
                  <div class="uma-art-shade" />
                  <div class="uma-card-copy">
                    <div class="flex items-start justify-between gap-1">
                      <span class="font-extrabold text-[13px] text-white leading-tight">{card.name}</span>
                      <span class="text-[9px] font-mono text-white/60">#{card.id}</span>
                    </div>
                    <div class="text-[10px] text-white/70 truncate mt-0.5">{card.title || 'Atuendo de Competición'}</div>
                    <div class="flex items-center justify-between mt-2">
                      <Show
                        when={owned()}
                        fallback={<span class="uma-status">NO ADQUIRIDA</span>}
                      >
                        {(o) => (
                          <div class="flex items-center gap-1.5">
                            <StarRow count={o().rarity} max={5} />
                            <span class="uma-potential">POT. {o().talent}</span>
                          </div>
                        )}
                      </Show>
                      <Show when={piecesMap()[card.piece_id]}>
                        <span class="text-[10px] font-bold text-amber-200">
                          {piecesMap()[card.piece_id]} pzs
                        </span>
                      </Show>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* Right column: Detailed Inspector & Editor */}
      <div class="xl:col-span-4">
        <Show
          when={detail()}
          fallback={
            <div class="uma-inspector-empty surface-card p-8 text-center space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto text-emerald-300">
                <Award size={24} />
              </div>
              <h4 class="text-base font-extrabold text-white">Inspector de Uma Musume</h4>
              <p class="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Selecciona cualquier aprendiz del catálogo izquierdo para configurar sus estrellas de rareza, nivel de despertar, pistas de habilidades, piezas estrella y vínculo.
              </p>
            </div>
          }
        >
          {(d) => {
            const card = () => d().card as CatalogUmaCard;
            const isOwned = () => Boolean(ownedMap()[card().id]);
            return (
              <div class="uma-inspector surface-card p-5 space-y-5">
                {/* Header */}
                <div class="flex items-start gap-4 border-b border-white/8 pb-4">
                  <img
                    src={getIconUrl('card', card().id)}
                    alt={card().name}
                    class="uma-inspector-art shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getIconUrl('chara', card().chara_id);
                    }}
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="tiny-chip turf">ID {card().id}</span>
                      <span class="tiny-chip">Chara #{card().chara_id}</span>
                      <Show when={isOwned()}>
                        <span class="tiny-chip gold">En Establo</span>
                      </Show>
                    </div>
                    <h3 class="text-lg font-extrabold text-white mt-1 truncate">{card().name}</h3>
                    <p class="text-xs text-[var(--text-muted)] truncate">{card().title}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div class="flex flex-wrap gap-2">
                  <button
                    class="btn-gold flex-1 py-2 text-xs"
                    onClick={() => quickMaxSingle(card().id)}
                  >
                    <Sparkles size={14} /> Desbloquear y Maximizar (5★ Lv5)
                  </button>
                  <Show when={isOwned()}>
                    <button
                      class="btn-danger py-2 px-3 text-xs"
                      onClick={() => removeSingle(card().id)}
                    >
                      <Trash2 size={14} /> Quitar
                    </button>
                  </Show>
                </div>

                {/* Base Aptitudes & Stat Growth */}
                <div class="space-y-2.5">
                  <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                    Aptitudes de Pista, Distancia y Estilo
                  </div>
                  <div class="grid grid-cols-5 gap-1.5">
                    <For each={card().apt || []}>
                      {(val, idx) => {
                        const grade = aptLabel(val);
                        return (
                          <div class="bg-black/25 border border-white/6 rounded-lg p-1.5 flex items-center justify-between">
                            <span class="text-[10px] font-bold text-[var(--text-muted)]">
                              {APT_NAMES[idx()]}
                            </span>
                            <span class={`apt-badge apt-${grade}`}>{grade}</span>
                          </div>
                        );
                      }}
                    </For>
                  </div>

                  <div class="grid grid-cols-5 gap-1.5 pt-1">
                    <For each={card().talent || []}>
                      {(bonus, idx) => (
                        <div class="bg-black/20 border border-white/5 rounded-lg p-1.5 text-center">
                          <div class="text-[10px] font-bold text-[var(--text-muted)]">
                            {TALENT_NAMES[idx()]}
                          </div>
                          <div class="text-xs font-extrabold text-emerald-300">+{bonus}%</div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                {/* Rarity, Awakening, Star Pieces, Bond & Fans */}
                <div class="grid grid-cols-2 gap-3 pt-2 border-t border-white/8">
                  <div>
                    <label class="field-label">Rareza (Estrellas 1–5)</label>
                    <div class="h-10 px-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                      <StarRow count={editRarity()} max={5} onSelect={(n) => setEditRarity(n)} />
                      <span class="text-xs font-extrabold text-amber-300">{editRarity()}★</span>
                    </div>
                  </div>

                  <div>
                    <label class="field-label">Potencial / Despertar (1–5)</label>
                    <select
                      class="select-input"
                      value={editTalent()}
                      onChange={(e) => setEditTalent(Number(e.currentTarget.value))}
                    >
                      <For each={[1, 2, 3, 4, 5]}>
                        {(lv) => <option value={lv}>Nivel de Potencial {lv}</option>}
                      </For>
                    </select>
                  </div>

                  <div>
                    <label class="field-label">Piezas Estrella (#{card().piece_id})</label>
                    <input
                      type="number"
                      min="0"
                      max="99999"
                      class="number-input"
                      value={editPieces()}
                      onInput={(e) => setEditPieces(Number(e.currentTarget.value))}
                    />
                  </div>

                  <div>
                    <label class="field-label">Puntos de Vínculo (Love)</label>
                    <input
                      type="number"
                      min="0"
                      max="999999"
                      class="number-input"
                      value={editLove()}
                      onInput={(e) => setEditLove(Number(e.currentTarget.value))}
                    />
                  </div>

                  <div class="col-span-2">
                    <label class="field-label">Total de Fans Acumulados</label>
                    <input
                      type="number"
                      min="1"
                      max="999999999"
                      class="number-input"
                      value={editFans()}
                      onInput={(e) => setEditFans(Number(e.currentTarget.value))}
                    />
                  </div>
                </div>

                {/* Awakening Skills Hints */}
                <div class="space-y-2 pt-2 border-t border-white/8">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Niveles de Pista de Habilidades ({editSkills().length})
                    </span>
                    <button
                      class="text-xs font-bold text-emerald-300 hover:underline"
                      onClick={() =>
                        setEditSkills((prev) => prev.map((s) => ({ ...s, level: 5 })))
                      }
                    >
                      Todas a Nv. 5
                    </button>
                  </div>
                  <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    <For each={editSkills()}>
                      {(sk, i) => (
                        <div class="flex items-center justify-between gap-2 bg-black/25 border border-white/6 rounded-xl px-3 py-2">
                          <div class="min-w-0">
                            <div class="text-xs font-bold text-white truncate">{sk.name}</div>
                            <div class="text-[10px] text-[var(--text-muted)]">
                              ID {sk.skill_id} · Despertar Nv.{sk.need_rank}
                            </div>
                          </div>
                          <select
                            class="select-input !w-24 !py-1 text-xs"
                            value={sk.level}
                            onChange={(e) => {
                              const lv = Number(e.currentTarget.value);
                              setEditSkills((prev) =>
                                prev.map((row, idx) => (idx === i() ? { ...row, level: lv } : row))
                              );
                            }}
                          >
                            <option value={0}>Sin pista</option>
                            <For each={[1, 2, 3, 4, 5]}>
                              {(lv) => <option value={lv}>Nv. {lv}</option>}
                            </For>
                          </select>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <button class="btn-primary w-full py-2.5" onClick={saveSingleUma}>
                  <Check size={16} /> Guardar Cambios en {card().name}
                </button>
              </div>
            );
          }}
        </Show>
      </div>
    </div>
  );
}

