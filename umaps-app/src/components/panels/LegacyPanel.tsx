import { createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import {
  Search,
  Sparkles,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Trophy,
  Copy,
  Lock,
  Unlock,
  Globe,
  Sliders,
} from 'lucide-solid';
import {
  call,
  catalog,
  currentViewer,
  getIconUrl,
  aptLabel,
  notify,
  ensureSkillsCatalog,
  ensureFactorsCatalog,
  skillsCatalog,
  factorsCatalog,
} from '../../api';
import type { VeteranSummary } from '../../types';

const STAT_KEYS = ['speed', 'stamina', 'pow', 'guts', 'wiz'];
const STAT_LABELS = ['Velocidad', 'Resistencia', 'Potencia', 'Coraje', 'Ingenio'];

const APT_KEYS = [
  'proper_ground_turf',
  'proper_ground_dirt',
  'proper_distance_short',
  'proper_distance_mile',
  'proper_distance_middle',
  'proper_distance_long',
  'proper_running_style_nige',
  'proper_running_style_senko',
  'proper_running_style_sashi',
  'proper_running_style_oikomi',
];

const APT_SHORT = [
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

export default function LegacyPanel() {
  const [subTab, setSubTab] = createSignal<'roster' | 'umamoe'>('roster');
  const [veterans, setVeterans] = createSignal<VeteranSummary[]>([]);
  const [capacity, setCapacity] = createSignal(200);
  const [search, setSearch] = createSignal('');
  const [selectedId, setSelectedId] = createSignal<number | null>(null);
  const [record, setRecord] = createSignal<any | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Add veteran modal / controls
  const [addCardId, setAddCardId] = createSignal<number>(100101);
  const [addMode, setAddMode] = createSignal<'maxed' | 'generated'>('maxed');

  // Skill & factor adders inside Veteran editor
  const [newSkillId, setNewSkillId] = createSignal<number>(100011);
  const [newFactorId, setNewFactorId] = createSignal<number>(10103);

  // uma.moe importer state
  const [umamoeKey, setUmamoeKey] = createSignal('');
  const [umamoeTarget, setUmamoeTarget] = createSignal('');
  const [umamoeData, setUmamoeData] = createSignal<any | null>(null);
  const [umamoeSelected, setUmamoeSelected] = createSignal<Record<string, boolean>>({});
  const [umamoeReplace, setUmamoeReplace] = createSignal(true);

  async function refreshRoster() {
    if (!currentViewer()) return;
    setLoading(true);
    try {
      const res = await call<{ veterans: VeteranSummary[]; capacity: number }>('legacy.list');
      setVeterans(res.veterans || []);
      setCapacity(res.capacity || 200);
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  async function selectVeteran(tid: number) {
    setSelectedId(tid);
    try {
      await Promise.all([ensureSkillsCatalog(), ensureFactorsCatalog()]);
      const res = await call<{ record: any }>('legacy.get', { id: tid });
      setRecord(res.record);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  createEffect(() => {
    if (currentViewer()) {
      void refreshRoster();
    }
  });

  const filteredVeterans = createMemo(() => {
    const q = search().trim().toLowerCase();
    return veterans().filter((v) => {
      if (!q) return true;
      return (
        (v.name || '').toLowerCase().includes(q) ||
        (v.rank_label || '').toLowerCase().includes(q) ||
        String(v.id).includes(q) ||
        String(v.card_id).includes(q)
      );
    });
  });

  async function addVeteran() {
    try {
      const res = await call<{ id: number }>('legacy.add', {
        card_id: addCardId(),
        mode: addMode(),
      });
      notify(`Veterana #${res.id} añadida al Salón de la Fama`);
      await refreshRoster();
      await selectVeteran(res.id);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function cloneVeteran(tid: number) {
    try {
      const res = await call<{ id: number }>('legacy.clone', { id: tid });
      notify(`Veterana clonada como #${res.id}`);
      await refreshRoster();
      await selectVeteran(res.id);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function applyBulk(action: string, ids: number[], extra: Record<string, any> = {}) {
    if (!ids.length) return;
    try {
      await call('legacy.apply', { action, ids, ...extra });
      notify(`Acción "${action}" aplicada a ${ids.length} veterana(s)`);
      await refreshRoster();
      if (selectedId() && ids.includes(selectedId()!)) {
        if (action === 'delete') {
          setSelectedId(null);
          setRecord(null);
        } else {
          await selectVeteran(selectedId()!);
        }
      }
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveVeteranRecord() {
    const tid = selectedId();
    const rec = record();
    if (!tid || !rec) return;
    try {
      await call('legacy.save', {
        id: tid,
        record: rec,
        auto_rank: true,
      });
      notify(`Guardados cambios de Veterana #${tid}`);
      await refreshRoster();
      await selectVeteran(tid);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  function updateRecField(field: string, value: any) {
    setRecord((prev: any) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function fetchUmamoe() {
    try {
      const res = await call('umamoe.fetch', {
        api_key: umamoeKey(),
        target: umamoeTarget(),
      });
      setUmamoeData(res);
      const sel: Record<string, boolean> = {};
      for (const e of res.entries || []) {
        if (!e.problem) sel[e.key] = true;
      }
      setUmamoeSelected(sel);
      notify(`Encontradas ${(res.entries || []).length} Uma(s) en uma.moe`);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function importUmamoe() {
    const keys = Object.entries(umamoeSelected())
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!keys.length) return;
    try {
      const res = await call<any>('umamoe.import', {
        api_key: umamoeKey(),
        target: umamoeTarget(),
        keys,
        replace: umamoeReplace(),
      });
      notify(
        `Importadas ${res.added?.length || 0} nuevas, actualizadas ${res.replaced?.length || 0}`
      );
      await refreshRoster();
      setSubTab('roster');
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="space-y-4">
      {/* Top Bar */}
      <div class="surface-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'roster'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('roster')}
          >
            <Trophy size={15} /> Salón de la Fama ({veterans().length} / {capacity()})
          </button>
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'umamoe'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('umamoe')}
          >
            <Globe size={15} /> Importador uma.moe
          </button>
        </div>

        <Show when={subTab() === 'roster'}>
          <div class="flex flex-wrap items-center gap-2">
            <select
              class="select-input !w-52 !py-1.5 text-xs"
              value={addCardId()}
              onChange={(e) => setAddCardId(Number(e.currentTarget.value))}
            >
              <For each={catalog()?.umas?.cards || []}>
                {(c) => (
                  <option value={c.id}>
                    {c.name} — {c.title} (#{c.id})
                  </option>
                )}
              </For>
            </select>
            <select
              class="select-input !w-36 !py-1.5 text-xs"
              value={addMode()}
              onChange={(e) => setAddMode(e.currentTarget.value as any)}
            >
              <option value="maxed"> Estadísticas Máx.</option>
              <option value="generated">Generada Normal</option>
            </select>
            <button class="btn-primary py-1.5 px-3 text-xs" onClick={addVeteran}>
              <Plus size={14} /> Crear Veterana
            </button>
            <button
              class="btn-gold py-1.5 px-3 text-xs"
              onClick={() =>
                applyBulk(
                  'max',
                  filteredVeterans().map((v) => v.id)
                )
              }
            >
              <Sparkles size={14} /> Maximizar Todas
            </button>
          </div>
        </Show>
      </div>

      {/* Sub-tab 1: Hall of Fame Roster */}
      <Show when={subTab() === 'roster'}>
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Roster list */}
          <div class="xl:col-span-6 space-y-3">
            <div class="surface-card p-3.5 flex items-center gap-2">
              <div class="relative flex-1">
                <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  class="text-input pl-9 py-2 text-xs"
                  placeholder="Filtrar veteranas por nombre, rango (UG, SS+) o ID..."
                  value={search()}
                  onInput={(e) => setSearch(e.currentTarget.value)}
                />
              </div>
              <button class="btn-subtle py-2 px-3 text-xs" onClick={refreshRoster}>
                <RefreshCw size={14} class={loading() ? 'animate-spin' : ''} />
              </button>
            </div>

            <div class="space-y-2 max-h-[670px] overflow-y-auto pr-1">
              <For each={filteredVeterans()}>
                {(vet) => (
                  <div
                    class={`item-row cursor-pointer ${selectedId() === vet.id ? 'selected' : ''}`}
                    onClick={() => selectVeteran(vet.id)}
                  >
                    <img
                      src={getIconUrl('card', vet.card_id)}
                      alt={vet.name}
                      class="w-12 h-12 rounded-xl object-cover border border-white/15 bg-black/40 shrink-0"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(vet.card_id / 100)); }}
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="tiny-chip gold text-[10px] py-0.5 px-2 font-black">
                            {vet.rank_label}
                          </span>
                          <span class="font-bold text-sm text-white truncate">{vet.name}</span>
                        </div>
                        <span class="text-[11px] font-mono text-emerald-300 font-bold">
                          {vet.score.toLocaleString()} pts
                        </span>
                      </div>

                      <div class="grid grid-cols-5 gap-1 mt-1.5">
                        <For each={vet.stats}>
                          {(st, idx) => (
                            <div class="bg-black/30 rounded px-1.5 py-0.5 text-[10px] flex items-center justify-between">
                              <span class="text-[var(--text-muted)]">
                                {['VEL', 'RES', 'POT', 'COR', 'INT'][idx()]}
                              </span>
                              <span class="font-extrabold text-white">{st}</span>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Right column: Full Veteran Record Editor */}
          <div class="xl:col-span-6">
            <Show
              when={record()}
              fallback={
                <div class="surface-card p-8 text-center space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto text-emerald-300">
                    <Trophy size={24} />
                  </div>
                  <h4 class="text-base font-extrabold text-white">Editor de Veterana / Legado</h4>
                  <p class="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    Selecciona una Uma entrenada para editar sus estadísticas (hasta 9999), aptitudes S, chispas de factor hereditario y habilidades aprendidas.
                  </p>
                </div>
              }
            >
              {(rec) => (
                <div class="surface-card p-5 space-y-5">
                  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div class="flex items-center gap-3">
                      <img
                        src={getIconUrl('card', rec().card_id)}
                        class="w-14 h-14 rounded-2xl border-2 border-emerald-400/40"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(rec().card_id / 100)); }}
                      />
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="tiny-chip turf">ID #{rec().trained_chara_id}</span>
                          <span class="tiny-chip gold">Puntuación {rec().rank_score}</span>
                        </div>
                        <h3 class="text-base font-extrabold text-white mt-1">
                          Carta #{rec().card_id}
                        </h3>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-1.5">
                      <button
                        class="btn-gold py-1.5 px-3 text-xs"
                        onClick={() => applyBulk('max', [rec().trained_chara_id])}
                      >
                        <Sparkles size={13} /> Máx. Todo
                      </button>
                      <button
                        class="btn-secondary py-1.5 px-3 text-xs"
                        onClick={() => cloneVeteran(rec().trained_chara_id)}
                      >
                        <Copy size={13} /> Clonar
                      </button>
                      <button
                        class="btn-danger py-1.5 px-2.5 text-xs"
                        onClick={() => applyBulk('delete', [rec().trained_chara_id])}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Stats 0-9999 */}
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                        Estadísticas Base (0 – 9999)
                      </span>
                      <div class="flex gap-2">
                        <button
                          class="text-xs font-bold text-emerald-300 hover:underline"
                          onClick={() => {
                            for (const k of STAT_KEYS) updateRecField(k, 1200);
                            updateRecField('rank_score', 25000);
                          }}
                        >
                          Todas 1200
                        </button>
                        <button
                          class="text-xs font-bold text-amber-300 hover:underline"
                          onClick={() => {
                            for (const k of STAT_KEYS) updateRecField(k, 9999);
                            updateRecField('rank_score', 99999);
                          }}
                        >
                          Todas 9999
                        </button>
                      </div>
                    </div>
                    <div class="grid grid-cols-5 gap-2">
                      <For each={STAT_KEYS}>
                        {(key, idx) => (
                          <div>
                            <label class="field-label !text-[10px]">{STAT_LABELS[idx()]}</label>
                            <input
                              type="number"
                              min="0"
                              max="9999"
                              class="number-input !px-2 !py-1.5 text-xs text-center font-extrabold"
                              value={rec()[key] || 0}
                              onInput={(e) => updateRecField(key, Number(e.currentTarget.value))}
                            />
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* Aptitudes G-S */}
                  <div class="space-y-2 pt-2 border-t border-white/8">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                        Aptitudes de Competición (G – S)
                      </span>
                      <button
                        class="text-xs font-bold text-amber-300 hover:underline"
                        onClick={() => {
                          for (const k of APT_KEYS) updateRecField(k, 8);
                        }}
                      >
                        Todas en Rango S
                      </button>
                    </div>
                    <div class="grid grid-cols-5 gap-2">
                      <For each={APT_KEYS}>
                        {(key, idx) => (
                          <div>
                            <label class="field-label !text-[10px]">{APT_SHORT[idx()]}</label>
                            <select
                              class="select-input !px-2 !py-1 text-xs font-bold"
                              value={rec()[key] || 7}
                              onChange={(e) => updateRecField(key, Number(e.currentTarget.value))}
                            >
                              <For each={[8, 7, 6, 5, 4, 3, 2, 1]}>
                                {(v) => <option value={v}>{aptLabel(v)}</option>}
                              </For>
                            </select>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* Score, Fans, Style */}
                  <div class="grid grid-cols-3 gap-3 pt-2 border-t border-white/8">
                    <div>
                      <label class="field-label">Puntuación de Rango</label>
                      <input
                        type="number"
                        class="number-input text-xs"
                        value={rec().rank_score || 0}
                        onInput={(e) => updateRecField('rank_score', Number(e.currentTarget.value))}
                      />
                    </div>
                    <div>
                      <label class="field-label">Fans</label>
                      <input
                        type="number"
                        class="number-input text-xs"
                        value={rec().fans || 0}
                        onInput={(e) => updateRecField('fans', Number(e.currentTarget.value))}
                      />
                    </div>
                    <div>
                      <label class="field-label">Estilo de Carrera</label>
                      <select
                        class="select-input text-xs"
                        value={rec().running_style || 1}
                        onChange={(e) =>
                          updateRecField('running_style', Number(e.currentTarget.value))
                        }
                      >
                        <option value={1}>1 · Fuga (Runner)</option>
                        <option value={2}>2 · Líder (Leader)</option>
                        <option value={3}>3 · Entre (Betweener)</option>
                        <option value={4}>4 · Cierre (Chaser)</option>
                      </select>
                    </div>
                  </div>

                  {/* Sparks / Factors */}
                  <div class="space-y-2 pt-2 border-t border-white/8">
                    <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Chispas Hereditarias (Factors: {(rec().factor_info_array || []).length})
                    </span>
                    <div class="flex gap-2">
                      <select
                        class="select-input flex-1 text-xs !py-1.5"
                        value={newFactorId()}
                        onChange={(e) => setNewFactorId(Number(e.currentTarget.value))}
                      >
                        <For each={factorsCatalog().slice(0, 300)}>
                          {(f) => (
                            <option value={f.id}>
                              [{f.stars}★] {f.name} (#{f.id})
                            </option>
                          )}
                        </For>
                      </select>
                      <button
                        class="btn-secondary py-1.5 px-3 text-xs"
                        onClick={() => {
                          const cur = rec().factor_info_array || [];
                          updateRecField('factor_info_array', [
                            ...cur,
                            { factor_id: newFactorId(), level: 0 },
                          ]);
                        }}
                      >
                        <Plus size={13} /> Añadir Chispa
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      <For each={rec().factor_info_array || []}>
                        {(f: any, i) => {
                          const meta = () =>
                            factorsCatalog().find((x) => x.id === f.factor_id);
                          return (
                            <span class="tiny-chip turf text-[11px] flex items-center gap-1.5">
                              {meta() ? `${meta()!.name} (${meta()!.stars}★)` : `Factor #${f.factor_id}`}
                              <button
                                class="text-rose-300 hover:text-white"
                                onClick={() => {
                                  const arr = [...(rec().factor_info_array || [])];
                                  arr.splice(i(), 1);
                                  updateRecField('factor_info_array', arr);
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        }}
                      </For>
                    </div>
                  </div>

                  {/* Learned Skills */}
                  <div class="space-y-2 pt-2 border-t border-white/8">
                    <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Habilidades Aprendidas ({(rec().skill_array || []).length})
                    </span>
                    <div class="flex gap-2">
                      <select
                        class="select-input flex-1 text-xs !py-1.5"
                        value={newSkillId()}
                        onChange={(e) => setNewSkillId(Number(e.currentTarget.value))}
                      >
                        <For each={skillsCatalog().slice(0, 400)}>
                          {(s) => (
                            <option value={s.id}>
                              {s.name} (#{s.id})
                            </option>
                          )}
                        </For>
                      </select>
                      <button
                        class="btn-secondary py-1.5 px-3 text-xs"
                        onClick={() => {
                          const cur = rec().skill_array || [];
                          if (!cur.some((x: any) => x.skill_id === newSkillId())) {
                            updateRecField('skill_array', [
                              ...cur,
                              { skill_id: newSkillId(), level: 1 },
                            ]);
                          }
                        }}
                      >
                        <Plus size={13} /> Añadir Habilidad
                      </button>
                    </div>
                  </div>

                  <button class="btn-primary w-full py-2.5" onClick={saveVeteranRecord}>
                    <Check size={16} /> Guardar Cambios en Veterana #{rec().trained_chara_id}
                  </button>
                </div>
              )}
            </Show>
          </div>
        </div>
      </Show>

      {/* Sub-tab 2: uma.moe Importer */}
      <Show when={subTab() === 'umamoe'}>
        <div class="surface-card p-5 space-y-4">
          <div>
            <span class="section-kicker">Sincronización Externa</span>
            <h3 class="text-base font-extrabold text-white mt-0.5">
              Importar Veteranas desde uma.moe
            </h3>
            <p class="text-xs text-[var(--text-muted)] mt-1">
              Introduce tu API Key de uma.moe y un ID de entrenador (9–12 dígitos) o UUID de veterana para importar sus registros directamente al Salón de la Fama local.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="field-label">API Key de uma.moe</label>
              <input
                type="password"
                class="text-input"
                placeholder="Pega tu X-API-Key..."
                value={umamoeKey()}
                onInput={(e) => setUmamoeKey(e.currentTarget.value)}
              />
            </div>
            <div>
              <label class="field-label">ID de Entrenador / URL / UUID</label>
              <input
                type="text"
                class="text-input"
                placeholder="Ej. 123456789 o enlace de perfil..."
                value={umamoeTarget()}
                onInput={(e) => setUmamoeTarget(e.currentTarget.value)}
              />
            </div>
            <div class="flex items-end gap-2">
              <button class="btn-secondary flex-1 py-2.5" onClick={fetchUmamoe}>
                <Search size={15} /> Consultar Perfil
              </button>
              <Show when={umamoeData()}>
                <button class="btn-primary flex-1 py-2.5" onClick={importUmamoe}>
                  <Check size={15} /> Importar Selección
                </button>
              </Show>
            </div>
          </div>

          <Show when={umamoeData()}>
            {(data) => (
              <div class="space-y-2 pt-3 border-t border-white/8">
                <div class="text-xs font-bold text-emerald-300">
                  Entrenador: {data().trainer?.name || data().trainer?.account_id} ·{' '}
                  {(data().entries || []).length} registros encontrados
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  <For each={data().entries || []}>
                    {(e: any) => (
                      <label class="item-row cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(umamoeSelected()[e.key])}
                          disabled={Boolean(e.problem)}
                          onChange={(ev) =>
                            setUmamoeSelected((p) => ({
                              ...p,
                              [e.key]: ev.currentTarget.checked,
                            }))
                          }
                        />
                        <img
                          src={getIconUrl('card', e.card_id)}
                          class="w-10 h-10 rounded-lg"
                          onError={(ev) => { ev.currentTarget.onerror = null; ev.currentTarget.src = getIconUrl('chara', Math.floor(e.card_id / 100)); }}
                        />
                        <div class="flex-1 min-w-0">
                          <div class="text-xs font-bold text-white truncate">
                            [{e.rank_label}] {e.name} ({e.score} pts)
                          </div>
                          <div class="text-[11px] text-[var(--text-muted)]">
                            {e.problem || `Tipo: ${e.kind} · Habilidades: ${e.skills ?? '?'}`}
                          </div>
                        </div>
                      </label>
                    )}
                  </For>
                </div>
              </div>
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}

