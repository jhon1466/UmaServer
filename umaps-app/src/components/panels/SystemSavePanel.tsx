import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import {
  Sliders,
  Database,
  History,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-solid';
import { call, currentViewer, notify, region, usersList } from '../../api';
import type { TuningKnob, HistoryRow } from '../../types';

const KNOB_SPANISH: Record<string, { title: string; desc: string }> = {
  training_gain_multiplier: {
    title: 'Multiplicador de ganancia en entrenamiento',
    desc: 'Multiplica todas las ganancias de estadísticas y puntos de habilidad al entrenar (ej. 2 = doble, 5 = quíntuple).',
  },
  specialty_priority_bonus: {
    title: 'Bono de prioridad de especialidad (Arcoíris)',
    desc: 'Peso extra para que las cartas de soporte aparezcan en su instalación correspondiente (500+ casi garantiza entrenamientos arcoíris).',
  },
  hint_rate_multiplier: {
    title: 'Multiplicador de frecuencia de pistas (!)',
    desc: 'Escala la probabilidad de que las cartas de soporte den pistas de habilidad (!). 15 equivale prácticamente al 100%.',
  },
  bond_gain_multiplier: {
    title: 'Multiplicador de ganancia de vínculo (Bond)',
    desc: 'Multiplica los puntos de amistad que suben al entrenar junto a una carta de soporte.',
  },
  energy_cost_multiplier: {
    title: 'Multiplicador de consumo de energía vital',
    desc: 'Escala cuánta energía cuesta entrenar (0 = entrenamientos gratis sin gastar energía).',
  },
  force_failure_rate: {
    title: 'Forzar porcentaje de fallo (%)',
    desc: 'Fija la probabilidad de fallo en todos los entrenamientos (0 = nunca falla jamás).',
  },
  force_training_gain: {
    title: 'Forzar ganancia fija por entrenamiento',
    desc: 'Fija la ganancia de estadísticas y SP a un número exacto fijo en cada entrenamiento.',
  },
};

export default function SystemSavePanel(props: { initialTab?: 'tuning' | 'save' | 'history' } = {}) {
  const [subTab, setSubTab] = createSignal<'tuning' | 'save' | 'history'>(props.initialTab || 'tuning');

  // Tuning state
  const [knobs, setKnobs] = createSignal<TuningKnob[]>([]);
  const [knobValues, setKnobValues] = createSignal<Record<string, string>>({});
  const [configPath, setConfigPath] = createSignal('');

  // Raw Save state
  const [saveKeys, setSaveKeys] = createSignal<
    { key: string; size: number; type: string; count: number; lazy: boolean }[]
  >([]);
  const [selectedKey, setSelectedKey] = createSignal('');
  const [dotPath, setDotPath] = createSignal('');
  const [rawJson, setRawJson] = createSignal('');
  const [importMode, setImportMode] = createSignal<'merge' | 'replace'>('merge');

  // History state
  const [historyRows, setHistoryRows] = createSignal<HistoryRow[]>([]);
  const [mineOnly, setMineOnly] = createSignal(false);

  createEffect(() => {
    const onSubtab = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail;
      if (tab === 'save' || tab === 'history' || tab === 'tuning') setSubTab(tab);
    };
    window.addEventListener('umaps:subtab', onSubtab);
    onCleanup(() => window.removeEventListener('umaps:subtab', onSubtab));
  });

  async function refreshCurrent() {
    const t = subTab();
    try {
      if (t === 'tuning') {
        const res = await call<{ path: string; knobs: TuningKnob[] }>(
          'tuning.get',
          {},
          { targetViewer: null }
        );
        setKnobs(res.knobs || []);
        setConfigPath(res.path || '');
        const vals: Record<string, string> = {};
        for (const k of res.knobs || []) {
          vals[k.key] = k.value === null || k.value === undefined ? '' : String(k.value);
        }
        setKnobValues(vals);
      } else if (t === 'save') {
        if (!currentViewer()) return;
        const rows = await call<any[]>('save.keys');
        setSaveKeys(rows || []);
      } else if (t === 'history') {
        const rows = await call<HistoryRow[]>('history.list', { limit: 300, this_viewer: mineOnly() });
        setHistoryRows(rows || []);
      }
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  createEffect(() => {
    if (subTab()) {
      void refreshCurrent();
    }
  });

  async function saveTuning() {
    const payload: Record<string, any> = {};
    for (const k of knobs()) {
      const raw = knobValues()[k.key];
      payload[k.key] = raw === '' || raw === undefined ? null : Number(raw);
    }
    try {
      await call('tuning.set', { values: payload }, { targetViewer: null });
      notify('Ajustes de entrenamiento del servidor guardados en client_config.json');
      await refreshCurrent();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  function applyGodModeTuning() {
    setKnobValues({
      training_gain_multiplier: '5',
      specialty_priority_bonus: '1000',
      hint_rate_multiplier: '20',
      bond_gain_multiplier: '10',
      energy_cost_multiplier: '0',
      force_failure_rate: '0',
      force_training_gain: '',
    });
    void saveTuning();
  }

  function resetVanillaTuning() {
    setKnobValues({
      training_gain_multiplier: '',
      specialty_priority_bonus: '',
      hint_rate_multiplier: '',
      bond_gain_multiplier: '',
      energy_cost_multiplier: '',
      force_failure_rate: '',
      force_training_gain: '',
    });
    void saveTuning();
  }

  async function loadSaveKey(k: string, p = '') {
    setSelectedKey(k);
    try {
      const res = await call<{ value: any }>('save.get', { key: k, path: p || undefined });
      setRawJson(JSON.stringify(res.value, null, 2));
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveRawKey() {
    if (!selectedKey()) return;
    try {
      await call('save.set', {
        key: selectedKey(),
        path: dotPath().trim() || undefined,
        value: rawJson(),
        create: true,
      });
      notify(`Clave "${selectedKey()}" guardada en la partida`);
      await refreshCurrent();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function deleteRawKey() {
    if (!selectedKey()) return;
    try {
      await call('save.delete', {
        key: selectedKey(),
        path: dotPath().trim() || undefined,
      });
      notify(`Clave "${selectedKey()}" eliminada`);
      setSelectedKey('');
      setRawJson('');
      await refreshCurrent();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function exportFullSave() {
    try {
      const data = await call<any>('save.export');
      const text = JSON.stringify(data, null, 2);
      setRawJson(text);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `umaps-save-${currentViewer()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Partida completa exportada en JSON');
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function importFullSave() {
    if (!rawJson().trim()) return;
    try {
      await call('save.import', {
        data: rawJson(),
        mode: importMode(),
      });
      notify(`Partida importada en modo "${importMode()}"`);
      await refreshCurrent();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function undoEntry(id: number) {
    try {
      await call('history.undo', { id });
      notify(`Cambio #${id} revertido correctamente`);
      await refreshCurrent();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="space-y-4">
      {/* Sub-navigation */}
      <div class="surface-card p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'tuning'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('tuning')}
          >
            <Sliders size={15} /> Ajustes del Servidor (Tuning)
          </button>
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'save'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('save')}
          >
            <Database size={15} /> Explorador JSON de Partida ({saveKeys().length})
          </button>
          <button
            class={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              subTab() === 'history'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
            onClick={() => setSubTab('history')}
          >
            <History size={15} /> Historial y Deshacer ({historyRows().length})
          </button>
        </div>

        <button class="btn-subtle py-1.5 px-3 text-xs" onClick={refreshCurrent}>
          <RefreshCw size={14} /> Recargar
        </button>
      </div>

      {/* 1. Server Tuning Knobs */}
      <Show when={subTab() === 'tuning'}>
        <div class="surface-card p-5 space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <span class="section-kicker">Multiplicadores Globales en Caliente</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Ajustes de Entrenamiento del Servidor (client_config.json)
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">
                Archivo activo: <code class="text-emerald-300">{configPath()}</code> (deja un campo vacío para usar la fórmula original del juego).
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="btn-gold py-2 px-3.5 text-xs" onClick={applyGodModeTuning}>
                <Sparkles size={14} /> Preset Entrenamiento Rápido (0% Fallo / 0 Energía / ×5 Stats)
              </button>
              <button class="btn-secondary py-2 px-3.5 text-xs" onClick={resetVanillaTuning}>
                Restaurar Valores Originales
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={knobs()}>
              {(k) => {
                const tr = () => KNOB_SPANISH[k.key] || { title: k.label, desc: k.help };
                return (
                  <div class="bg-black/25 border border-white/8 rounded-2xl p-4 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm font-extrabold text-white">{tr().title}</span>
                      <span class="tiny-chip text-[10px]">
                        {k.min} – {k.max}
                      </span>
                    </div>
                    <p class="text-xs text-[var(--text-muted)] leading-relaxed">{tr().desc}</p>
                    <input
                      type="number"
                      step={k.kind === 'float' ? '0.1' : '1'}
                      min={k.min}
                      max={k.max}
                      placeholder="Fórmula original (vacío)"
                      class="number-input mt-1"
                      value={knobValues()[k.key] ?? ''}
                      onInput={(e) =>
                        setKnobValues((p) => ({ ...p, [k.key]: e.currentTarget.value }))
                      }
                    />
                  </div>
                );
              }}
            </For>
          </div>

          <button class="btn-primary w-full py-3" onClick={saveTuning}>
            <Check size={16} /> Guardar Multiplicadores en el Servidor
          </button>
        </div>
      </Show>

      {/* 2. Raw Save JSON Explorer */}
      <Show when={subTab() === 'save'}>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div class="lg:col-span-4 surface-card p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Claves de Estado ({saveKeys().length})
              </span>
              <button class="btn-secondary py-1 px-2.5 text-xs" onClick={exportFullSave}>
                <Download size={13} /> Exportar Todo
              </button>
            </div>
            <div class="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              <For each={saveKeys()}>
                {(row) => (
                  <div
                    class={`item-row cursor-pointer justify-between !py-2 ${
                      selectedKey() === row.key ? 'selected' : ''
                    }`}
                    onClick={() => loadSaveKey(row.key)}
                  >
                    <div class="min-w-0">
                      <div class="text-xs font-bold text-white truncate font-mono">{row.key}</div>
                      <div class="text-[10px] text-[var(--text-muted)]">
                        {row.type} · {(row.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Show when={row.count !== null}>
                      <span class="tiny-chip text-[10px]">{row.count}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="lg:col-span-8 surface-card p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  class="text-input !w-56 text-xs font-mono"
                  placeholder="Nombre de clave (key)..."
                  value={selectedKey()}
                  onInput={(e) => setSelectedKey(e.currentTarget.value)}
                />
                <input
                  type="text"
                  class="text-input flex-1 text-xs font-mono"
                  placeholder="Sub-ruta opcional (ej. data.chara_info.speed)..."
                  value={dotPath()}
                  onInput={(e) => setDotPath(e.currentTarget.value)}
                />
                <button
                  class="btn-subtle py-2 px-3 text-xs"
                  onClick={() => loadSaveKey(selectedKey(), dotPath())}
                >
                  Cargar Ruta
                </button>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary py-2 px-3.5 text-xs" onClick={saveRawKey}>
                  <Check size={14} /> Guardar Clave
                </button>
                <button class="btn-danger py-2 px-3 text-xs" onClick={deleteRawKey}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              class="code-editor h-[480px]"
              placeholder="Selecciona una clave de la izquierda o pega un JSON completo aquí para importarlo..."
              value={rawJson()}
              onInput={(e) => setRawJson(e.currentTarget.value)}
            />

            <div class="flex items-center justify-between pt-2 border-t border-white/8">
              <div class="flex items-center gap-2">
                <span class="text-xs text-[var(--text-muted)]">Modo de Importación Total:</span>
                <select
                  class="select-input !w-40 !py-1.5 text-xs"
                  value={importMode()}
                  onChange={(e) => setImportMode(e.currentTarget.value as any)}
                >
                  <option value="merge">Combinar (Merge)</option>
                  <option value="replace">Reemplazar Todo</option>
                </select>
              </div>
              <button class="btn-gold py-2 px-4 text-xs" onClick={importFullSave}>
                <Upload size={14} /> Importar JSON en la Cuenta
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* 3. Undo Audit History */}
      <Show when={subTab() === 'history'}>
        <div class="surface-card p-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
           <div>
            <span class="section-kicker">Registro de Auditoría</span>
            <h3 class="text-base font-extrabold text-white mt-0.5">
              Historial de Cambios y Reversión Instantánea
            </h3>
           </div>
           <label class="flex items-center gap-2 text-xs text-[var(--text-muted)]"><input type="checkbox" checked={mineOnly()} onChange={e => { setMineOnly(e.currentTarget.checked); void refreshCurrent(); }} /> Solo entrenador actual</label>
          </div>

          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            <For each={historyRows()}>
              {(row) => (
                <div class="item-row justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="tiny-chip turf text-[10px]">#{row.id}</span>
                      <span class="text-sm font-bold text-white">{row.label}</span>
                      <span class="tiny-chip text-[10px] font-mono">{region().toUpperCase()} · {usersList().find(u => u.id === row.viewer)?.name || row.viewer}</span>
                    </div>
                    <div class="text-xs text-[var(--text-muted)] mt-1">
                      Operación: <code>{row.op}</code> · Claves tocadas: {(row.keys || []).join(', ')}
                    </div>
                  </div>
                  <button
                    class="btn-secondary py-1.5 px-3 text-xs"
                    onClick={() => undoEntry(row.id)}
                  >
                    <RotateCcw size={13} /> Deshacer
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

