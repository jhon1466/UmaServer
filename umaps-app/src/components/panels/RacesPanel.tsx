import { createSignal, createEffect, For, Show } from 'solid-js';
import {
  Flag,
  Play,
  Plus,
  Trash2,
  Save,
  Upload,
  RefreshCw,
  Award,
  Sparkles,
  Check,
  X,
} from 'lucide-solid';
import {
  call,
  catalog,
  currentViewer,
  getIconUrl,
  notify,
} from '../../api';

export default function RacesPanel() {
  const [raceList, setRaceList] = createSignal<any | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Builder state
  const [raceName, setRaceName] = createSignal('Copa Tracen Especial');
  const [raceInstanceId, setRaceInstanceId] = createSignal<number>(100101);
  const [season, setSeason] = createSignal<number>(1);
  const [weather, setWeather] = createSignal<number>(1);
  const [groundCondition, setGroundCondition] = createSignal<number>(1);
  const [seed, setSeed] = createSignal<string>('');
  const [runners, setRunners] = createSignal<any[]>([]);

  // Simulation result
  const [simResult, setSimResult] = createSignal<any | null>(null);

  // Add runner picker
  const [pickCardId, setPickCardId] = createSignal<number>(100101);

  async function refreshRaces() {
    if (!currentViewer()) return;
    setLoading(true);
    try {
      const res = await call<any>('races.list');
      setRaceList(res);
      if (res.courses?.length && !res.courses.some((c: any) => c.id === raceInstanceId())) {
        setRaceInstanceId(res.courses[0].id);
      }
      if (runners().length === 0 && (res.roster?.length || res.cards?.length)) {
        const initial: any[] = [];
        const cards = res.cards || [];
        for (let i = 0; i < Math.min(9, cards.length); i++) {
          initial.push({
            card_id: cards[i].id,
            name: cards[i].name,
            speed: 1200,
            stamina: 1200,
            power: 1200,
            guts: 1200,
            wiz: 1200,
            running_style: (i % 4) + 1,
            motivation: 5,
            main: i < 3,
          });
        }
        setRunners(initial);
      }
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    if (currentViewer()) {
      void refreshRaces();
    }
  });

  function addRunnerFromCard() {
    const cid = pickCardId();
    const card = (catalog()?.umas?.cards || []).find((c) => c.id === cid);
    setRunners((prev) => [
      ...prev,
      {
        card_id: cid,
        name: card?.name || `Uma #${cid}`,
        speed: 1200,
        stamina: 1200,
        power: 1200,
        guts: 1200,
        wiz: 1200,
        running_style: 2,
        motivation: 5,
        main: prev.filter((r) => r.main).length < 3,
      },
    ]);
  }

  function addRunnerFromVeteran(vet: any) {
    setRunners((prev) => [
      ...prev,
      {
        card_id: vet.card_id,
        name: vet.name || `Veterana #${vet.trained_chara_id}`,
        speed: vet.speed || 1200,
        stamina: vet.stamina || 1200,
        power: vet.pow || vet.power || 1200,
        guts: vet.guts || 1200,
        wiz: vet.wiz || 1200,
        running_style: vet.running_style || 2,
        motivation: 5,
        skill_array: vet.skill_array || [],
        main: prev.filter((r) => r.main).length < 3,
      },
    ]);
  }

  function buildDefinition() {
    return {
      settings: {
        race_instance_id: raceInstanceId(),
        season: season(),
        weather: weather(),
        ground_condition: groundCondition(),
        motivation: 5,
        seed: seed().trim() ? Number(seed()) : null,
      },
      runners: runners().map((r) => ({
        card_id: r.card_id,
        speed: Number(r.speed || 1000),
        stamina: Number(r.stamina || 1000),
        power: Number(r.power || 1000),
        guts: Number(r.guts || 1000),
        wiz: Number(r.wiz || 1000),
        running_style: Number(r.running_style || 2),
        motivation: Number(r.motivation || 5),
        skill_array: r.skill_array || [],
        main: Boolean(r.main),
      })),
    };
  }

  async function runSimulation() {
    try {
      const res = await call<any>('races.run', {
        name: raceName(),
        definition: buildDefinition(),
      });
      setSimResult(res);
      notify(`Carrera simulada (${runners().length} corredoras)`);
      await refreshRaces();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveTemplate() {
    try {
      await call('races.save', {
        name: raceName(),
        definition: buildDefinition(),
      });
      notify(`Plantilla "${raceName()}" guardada`);
      await refreshRaces();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function injectRace(raceId: number, destination: 'practice' | 'saved') {
    try {
      await call('races.inject', { id: raceId, destination });
      notify(
        destination === 'practice'
          ? 'Carrera encolada para la próxima Carrera de Práctica en el juego'
          : 'Carrera guardada en la estantería de repeticiones del juego'
      );
      await refreshRaces();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left: Race Configuration & Runner Lineup */}
      <div class="xl:col-span-7 space-y-4">
        <div class="surface-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="section-kicker">Simulador Exacto Rust</span>
              <h3 class="text-base font-extrabold text-white mt-0.5">
                Constructor de Carreras de Práctica
              </h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="btn-secondary py-2 px-3 text-xs" onClick={saveTemplate}>
                <Save size={14} /> Guardar Plantilla
              </button>
              <button class="btn-primary py-2 px-4 text-xs" onClick={runSimulation}>
                <Play size={14} /> Simular Carrera Ahora
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="field-label">Nombre del Evento</label>
              <input
                type="text"
                class="text-input text-xs"
                value={raceName()}
                onInput={(e) => setRaceName(e.currentTarget.value)}
              />
            </div>
            <div>
              <label class="field-label">Hipódromo y Distancia</label>
              <select
                class="select-input text-xs"
                value={raceInstanceId()}
                onChange={(e) => setRaceInstanceId(Number(e.currentTarget.value))}
              >
                <For each={raceList()?.courses || []}>
                  {(c: any) => (
                    <option value={c.id}>
                      {c.name} (#{c.id})
                    </option>
                  )}
                </For>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label class="field-label">Estación</label>
              <select
                class="select-input text-xs"
                value={season()}
                onChange={(e) => setSeason(Number(e.currentTarget.value))}
              >
                <option value={1}>Primavera</option>
                <option value={2}>Verano</option>
                <option value={3}>Otoño</option>
                <option value={4}>Invierno</option>
                <option value={5}>Sakura</option>
              </select>
            </div>
            <div>
              <label class="field-label">Clima</label>
              <select
                class="select-input text-xs"
                value={weather()}
                onChange={(e) => setWeather(Number(e.currentTarget.value))}
              >
                <option value={1}>Soleado</option>
                <option value={2}>Nublado</option>
                <option value={3}>Lluvia</option>
                <option value={4}>Nieve</option>
              </select>
            </div>
            <div>
              <label class="field-label">Estado de Pista</label>
              <select
                class="select-input text-xs"
                value={groundCondition()}
                onChange={(e) => setGroundCondition(Number(e.currentTarget.value))}
              >
                <option value={1}>Firme (Good)</option>
                <option value={2}>Suave (Yielding)</option>
                <option value={3}>Pesada (Soft)</option>
                <option value={4}>Muy Pesada (Heavy)</option>
              </select>
            </div>
            <div>
              <label class="field-label">Semilla RNG (Opcional)</label>
              <input
                type="number"
                class="number-input text-xs"
                placeholder="Aleatoria"
                value={seed()}
                onInput={(e) => setSeed(e.currentTarget.value)}
              />
            </div>
          </div>
        </div>

        {/* Runner Lineup */}
        <div class="surface-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Parrilla de Corredoras ({runners().length} / 255)
            </span>
            <div class="flex items-center gap-2">
              <select
                class="select-input !w-52 !py-1.5 text-xs"
                value={pickCardId()}
                onChange={(e) => setPickCardId(Number(e.currentTarget.value))}
              >
                <For each={catalog()?.umas?.cards || []}>
                  {(c) => (
                    <option value={c.id}>
                      {c.name} (#{c.id})
                    </option>
                  )}
                </For>
              </select>
              <button class="btn-secondary py-1.5 px-3 text-xs" onClick={addRunnerFromCard}>
                <Plus size={14} /> Añadir Corredora
              </button>
            </div>
          </div>

          <div class="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            <For each={runners()}>
              {(r, idx) => (
                <div class="bg-black/25 border border-white/8 rounded-xl p-3 flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2.5 min-w-[170px]">
                    <span class="tiny-chip turf text-[10px]">#{idx() + 1}</span>
                    <img
                      src={getIconUrl('card', r.card_id)}
                      class="w-10 h-10 rounded-xl border border-white/15"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(r.card_id / 100)); }}
                    />
                    <div class="min-w-0">
                      <div class="text-xs font-bold text-white truncate">
                        {r.name || `Uma #${r.card_id}`}
                      </div>
                      <label class="flex items-center gap-1 text-[10px] text-amber-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(r.main)}
                          onChange={(e) => {
                            const checked = e.currentTarget.checked;
                            setRunners((prev) =>
                              prev.map((row, i) => (i === idx() ? { ...row, main: checked } : row))
                            );
                          }}
                        />
                        Principal (Main)
                      </label>
                    </div>
                  </div>

                  <div class="grid grid-cols-5 gap-1.5 flex-1 min-w-[260px]">
                    <For each={['speed', 'stamina', 'power', 'guts', 'wiz']}>
                      {(k, sIdx) => (
                        <div>
                          <span class="text-[9px] font-bold text-[var(--text-muted)] block text-center">
                            {['VEL', 'RES', 'POT', 'COR', 'INT'][sIdx()]}
                          </span>
                          <input
                            type="number"
                            class="number-input !px-1 !py-1 text-xs text-center"
                            value={r[k]}
                            onInput={(e) => {
                              const val = Number(e.currentTarget.value);
                              setRunners((prev) =>
                                prev.map((row, i) => (i === idx() ? { ...row, [k]: val } : row))
                              );
                            }}
                          />
                        </div>
                      )}
                    </For>
                  </div>

                  <button
                    class="btn-danger py-1.5 px-2.5 text-xs"
                    onClick={() => setRunners((prev) => prev.filter((_, i) => i !== idx()))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Right: Simulation Results, Queue & Saved Library */}
      <div class="xl:col-span-5 space-y-4">
        <Show when={simResult()}>
          {(sim) => (
            <div class="surface-card p-5 space-y-4">
              <div class="flex items-center justify-between border-b border-white/8 pb-3">
                <div>
                  <span class="section-kicker">Resultado Oficial</span>
                  <h4 class="text-base font-extrabold text-white">
                    Clasificación de la Simulación
                  </h4>
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn-gold py-1.5 px-3 text-xs"
                    onClick={() => injectRace(sim().entry.practice_race_id, 'practice')}
                  >
                    <Upload size={13} /> Inyectar Próxima Práctica
                  </button>
                  <button
                    class="btn-secondary py-1.5 px-3 text-xs"
                    onClick={() => injectRace(sim().entry.practice_race_id, 'saved')}
                  >
                    Guardar Replay
                  </button>
                </div>
              </div>

              <div class="space-y-1.5 max-h-80 overflow-y-auto">
                <For
                  each={[...(sim().horses || [])].sort(
                    (a, b) => (a.finish_order || 99) - (b.finish_order || 99)
                  )}
                >
                  {(h: any) => (
                    <div class="flex items-center justify-between bg-black/25 border border-white/6 rounded-xl px-3 py-2">
                      <div class="flex items-center gap-2.5">
                        <span
                          class={`tiny-chip text-xs font-black ${
                            h.finish_order === 1
                              ? 'gold'
                              : h.finish_order <= 3
                              ? 'turf'
                              : ''
                          }`}
                        >
                          #{h.finish_order}
                        </span>
                        <img
                          src={getIconUrl('card', h.card_id)}
                          class="w-8 h-8 rounded-lg"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(h.card_id / 100)); }}
                        />
                        <span class="text-xs font-bold text-white">
                          Puerta {h.frame_order} · Carta #{h.card_id}
                        </span>
                      </div>
                      <span class="text-xs font-mono text-emerald-300">
                        {h.finish_time ? `${(h.finish_time / 10000).toFixed(2)}s` : ''}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </Show>

        {/* Queued & Saved Races */}
        <div class="surface-card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-extrabold text-white">
              Cola de Práctica y Carreras Guardadas
            </h4>
            <button class="btn-subtle py-1 px-2.5 text-xs" onClick={refreshRaces}>
              <RefreshCw size={13} />
            </button>
          </div>

          <Show when={raceList()?.queued}>
            {(q) => (
              <div class="bg-emerald-500/15 border border-emerald-400/35 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div class="text-xs font-extrabold text-emerald-200">
                    En Cola: {q().name}
                  </div>
                  <div class="text-[11px] text-emerald-300/80">
                    Instancia #{q().race_instance_id} · {q().entry_num} corredoras
                  </div>
                </div>
                <button
                  class="btn-danger py-1 px-2.5 text-xs"
                  onClick={async () => {
                    await call('races.unqueue');
                    await refreshRaces();
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </Show>

          <div class="space-y-2">
            <div class="text-xs font-bold text-[var(--text-muted)]">
              Plantillas Guardadas ({(raceList()?.templates || []).length})
            </div>
            <For each={raceList()?.templates || []}>
              {(tpl: any) => (
                <div class="item-row justify-between">
                  <div>
                    <div class="text-xs font-bold text-white">{tpl.name}</div>
                    <div class="text-[10px] text-[var(--text-muted)]">
                      {(tpl.definition?.runners || []).length} corredoras
                    </div>
                  </div>
                  <div class="flex gap-1.5">
                    <button
                      class="btn-secondary py-1 px-2.5 text-xs"
                      onClick={() => {
                        setRaceName(tpl.name);
                        if (tpl.definition?.settings?.race_instance_id) {
                          setRaceInstanceId(tpl.definition.settings.race_instance_id);
                        }
                        if (tpl.definition?.runners) {
                          setRunners(tpl.definition.runners);
                        }
                      }}
                    >
                      Cargar
                    </button>
                    <button
                      class="btn-danger py-1 px-2 text-xs"
                      onClick={async () => {
                        await call('races.delete_template', { id: tpl.id });
                        await refreshRaces();
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}

