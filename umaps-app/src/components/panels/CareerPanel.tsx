import { createSignal, createEffect, For, Show } from 'solid-js';
import {
  Flame,
  Sparkles,
  Check,
  RefreshCw,
  FastForward,
  Play,
  Archive,
  Trash2,
  Plus,
  Heart,
  Shield,
  Zap,
  Award,
} from 'lucide-solid';
import {
  call,
  currentViewer,
  getIconUrl,
  notify,
  ensureSkillsCatalog,
  skillsCatalog,
} from '../../api';
import type { CareerState } from '../../types';

const MOTIVATION_LABELS: Record<number, string> = {
  5: '5 · Excelente (Great)',
  4: '4 · Bueno (Good)',
  3: '3 · Normal',
  2: '2 · Malo (Bad)',
  1: '1 · Pésimo (Awful)',
};

export default function CareerPanel() {
  const [state, setState] = createSignal<CareerState | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Editable stats
  const [speed, setSpeed] = createSignal(800);
  const [stamina, setStamina] = createSignal(800);
  const [pow, setPow] = createSignal(800);
  const [guts, setGuts] = createSignal(800);
  const [wiz, setWiz] = createSignal(800);
  const [maxSpeed, setMaxSpeed] = createSignal(1200);
  const [maxStamina, setMaxStamina] = createSignal(1200);
  const [maxPow, setMaxPow] = createSignal(1200);
  const [maxGuts, setMaxGuts] = createSignal(1200);
  const [maxWiz, setMaxWiz] = createSignal(1200);
  const [vital, setVital] = createSignal(100);
  const [motivation, setMotivation] = createSignal(5);
  const [skillPoint, setSkillPoint] = createSignal(9999);
  const [fans, setFans] = createSignal(100000);

  // Command controls
  const [targetTurn, setTargetTurn] = createSignal(1);
  const [fillRaces, setFillRaces] = createSignal(true);
  const [selectedSkillId, setSelectedSkillId] = createSignal(100011);
  const [parkSlotName, setParkSlotName] = createSignal('slot-1');

  async function refreshCareer() {
    if (!currentViewer()) return;
    setLoading(true);
    try {
      await ensureSkillsCatalog();
      const st = await call<CareerState>('career.state');
      setState(st);
      if (st.active && st.chara_info) {
        const ci = st.chara_info;
        setSpeed(ci.speed || 0);
        setStamina(ci.stamina || 0);
        setPow(ci.pow || 0);
        setGuts(ci.guts || 0);
        setWiz(ci.wiz || 0);
        setMaxSpeed(ci.max_speed || 1200);
        setMaxStamina(ci.max_stamina || 1200);
        setMaxPow(ci.max_pow || 1200);
        setMaxGuts(ci.max_guts || 1200);
        setMaxWiz(ci.max_wiz || 1200);
        setVital(ci.vital ?? 100);
        setMotivation(ci.motivation ?? 5);
        setSkillPoint(ci.skill_point ?? 0);
        setFans(ci.fans ?? 1);
        setTargetTurn(ci.turn || 1);
      }
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    if (currentViewer()) {
      void refreshCareer();
    }
  });

  async function savePatch() {
    try {
      await call('career.patch', {
        fields: {
          speed: speed(),
          stamina: stamina(),
          pow: pow(),
          guts: guts(),
          wiz: wiz(),
          max_speed: maxSpeed(),
          max_stamina: maxStamina(),
          max_pow: maxPow(),
          max_guts: maxGuts(),
          max_wiz: maxWiz(),
          vital: vital(),
          motivation: motivation(),
          skill_point: skillPoint(),
          fans: fans(),
        },
        regrade: true,
      });
      notify('Atributos de la carrera activa actualizados');
      await refreshCareer();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  function presetMaxCareer() {
    setSpeed(1200);
    setStamina(1200);
    setPow(1200);
    setGuts(1200);
    setWiz(1200);
    setMaxSpeed(1200);
    setMaxStamina(1200);
    setMaxPow(1200);
    setMaxGuts(1200);
    setMaxWiz(1200);
    setVital(100);
    setMotivation(5);
    setSkillPoint(9999);
    setFans(500000);
    void savePatch();
  }

  async function runCmd(cmd: string, opts: Record<string, any> = {}, extra: Record<string, any> = {}) {
    try {
      await call('career.cmd', { cmd, opts, ...extra });
      notify(`Comando de carrera ejecutado: ${cmd}`);
      await refreshCareer();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="space-y-5">
      {/* Header & Parked Slots */}
      <div class="surface-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="section-kicker">Modo Entrenamiento (Single Mode)</span>
          <h3 class="text-base font-extrabold text-white mt-0.5">
            Inspector y Editor de Carrera en Curso
          </h3>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            type="text"
            class="text-input !w-36 !py-1.5 text-xs"
            placeholder="Nombre de ranura..."
            value={parkSlotName()}
            onInput={(e) => setParkSlotName(e.currentTarget.value)}
          />
          <Show when={state()?.active}>
            <button
              class="btn-secondary py-1.5 px-3 text-xs"
              onClick={() => runCmd('park', { name: parkSlotName(), force: true })}
            >
              <Archive size={14} /> Aparcar Carrera
            </button>
          </Show>
          <button class="btn-subtle py-1.5 px-3 text-xs" onClick={refreshCareer}>
            <RefreshCw size={14} class={loading() ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Parked Career Slots if any */}
      <Show when={(state()?.parked || []).length > 0}>
        <div class="surface-card p-4 space-y-2.5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
            Carreras Aparcadas en Ranuras ({(state()?.parked || []).length})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <For each={state()?.parked || []}>
              {(slot) => (
                <div class="item-row justify-between">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getIconUrl('card', slot.card_id)}
                      class="w-10 h-10 rounded-xl border border-white/15"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(slot.card_id / 100)); }}
                    />
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-white truncate">{slot.name}</div>
                      <div class="text-[11px] text-[var(--text-muted)] truncate">
                        {slot.card} · Turno {slot.turn}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      class="btn-primary py-1 px-2.5 text-xs"
                      onClick={() => runCmd('resume', { name: slot.name })}
                    >
                      Reanudar
                    </button>
                    <button
                      class="btn-danger py-1 px-2 text-xs"
                      onClick={() => runCmd('drop_slot', {}, { name: slot.name })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show
        when={state()?.active && state()?.chara_info}
        fallback={
          <div class="surface-card p-10 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto text-emerald-300">
              <Flame size={26} />
            </div>
            <h4 class="text-base font-extrabold text-white">No hay una carrera activa en curso</h4>
            <p class="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Inicia un nuevo entrenamiento (Career) dentro del juego o reanuda una carrera aparcada arriba para desbloquear el editor de estadísticas en vivo, turnos, vínculos y objetivos.
            </p>
          </div>
        }
      >
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Live Stats, Energy, Motivation, Turn Jumper */}
          <div class="xl:col-span-7 space-y-4">
            <div class="surface-card p-5 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div class="flex items-center gap-3.5">
                  <img
                    src={getIconUrl('card', state()!.chara_info!.card_id)}
                    class="w-16 h-16 rounded-2xl border-2 border-emerald-400/40"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getIconUrl('chara', Math.floor(state()!.chara_info!.card_id / 100)); }}
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="tiny-chip turf">{state()!.scenario_name}</span>
                      <span class="tiny-chip gold">
                        Turno {state()!.chara_info!.turn} · {state()!.turn_label}
                      </span>
                    </div>
                    <h3 class="text-lg font-extrabold text-white mt-1">{state()!.card}</h3>
                    <p class="text-xs text-[var(--text-muted)]">
                      Estado: {state()!.state_name} · Objetivos cumplidos: {state()!.goals_cleared}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button class="btn-gold py-2 px-3 text-xs" onClick={presetMaxCareer}>
                    <Sparkles size={14} /> Todo a 1200 + 9999 SP
                  </button>
                  <button
                    class="btn-secondary py-2 px-3 text-xs"
                    onClick={() => runCmd('idle_complete')}
                  >
                    <FastForward size={14} /> Autocompletar Carrera
                  </button>
                </div>
              </div>

              {/* 5 Main Stats + Caps */}
              <div class="grid grid-cols-5 gap-2.5">
                <div>
                  <label class="field-label">Velocidad</label>
                  <input
                    type="number"
                    class="number-input text-center font-bold"
                    value={speed()}
                    onInput={(e) => setSpeed(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Resistencia</label>
                  <input
                    type="number"
                    class="number-input text-center font-bold"
                    value={stamina()}
                    onInput={(e) => setStamina(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Potencia</label>
                  <input
                    type="number"
                    class="number-input text-center font-bold"
                    value={pow()}
                    onInput={(e) => setPow(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Coraje</label>
                  <input
                    type="number"
                    class="number-input text-center font-bold"
                    value={guts()}
                    onInput={(e) => setGuts(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Ingenio</label>
                  <input
                    type="number"
                    class="number-input text-center font-bold"
                    value={wiz()}
                    onInput={(e) => setWiz(Number(e.currentTarget.value))}
                  />
                </div>
              </div>

              {/* Vital, Motivation, Skill Points, Fans */}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/8">
                <div>
                  <label class="field-label">Energía Vital (0–100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    class="number-input"
                    value={vital()}
                    onInput={(e) => setVital(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Humor / Motivación</label>
                  <select
                    class="select-input"
                    value={motivation()}
                    onChange={(e) => setMotivation(Number(e.currentTarget.value))}
                  >
                    <For each={[5, 4, 3, 2, 1]}>
                      {(m) => <option value={m}>{MOTIVATION_LABELS[m]}</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label class="field-label">Puntos Habilidad (SP)</label>
                  <input
                    type="number"
                    class="number-input"
                    value={skillPoint()}
                    onInput={(e) => setSkillPoint(Number(e.currentTarget.value))}
                  />
                </div>
                <div>
                  <label class="field-label">Fans en Carrera</label>
                  <input
                    type="number"
                    class="number-input"
                    value={fans()}
                    onInput={(e) => setFans(Number(e.currentTarget.value))}
                  />
                </div>
              </div>

              <button class="btn-primary w-full py-2.5" onClick={savePatch}>
                <Check size={16} /> Guardar Estadísticas de Carrera
              </button>
            </div>

            {/* Turn Jumper & Facility Unlocks */}
            <div class="surface-card p-5 space-y-4">
              <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Control de Turno, Instalaciones y Habilidades
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-black/25 border border-white/8 rounded-xl p-3 space-y-2">
                  <label class="field-label">Saltar al Turno (1 – {state()?.end_turn || 78})</label>
                  <div class="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={state()?.end_turn || 78}
                      class="number-input !w-24"
                      value={targetTurn()}
                      onInput={(e) => setTargetTurn(Number(e.currentTarget.value))}
                    />
                    <button
                      class="btn-secondary flex-1 text-xs"
                      onClick={() =>
                        runCmd('set_turn', {
                          value: targetTurn(),
                          fill_races: fillRaces(),
                          rank: 1,
                          with_rewards: true,
                        })
                      }
                    >
                      Mover Turno
                    </button>
                  </div>
                  <label class="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fillRaces()}
                      onChange={(e) => setFillRaces(e.currentTarget.checked)}
                    />
                    Ganar automáticamente carreras obligatorias previas
                  </label>
                </div>

                <div class="bg-black/25 border border-white/8 rounded-xl p-3 space-y-2">
                  <label class="field-label">Otorgar Habilidad Directa</label>
                  <div class="flex gap-2">
                    <select
                      class="select-input flex-1 text-xs"
                      value={selectedSkillId()}
                      onChange={(e) => setSelectedSkillId(Number(e.currentTarget.value))}
                    >
                      <For each={skillsCatalog().slice(0, 350)}>
                        {(s) => (
                          <option value={s.id}>
                            {s.name} (#{s.id})
                          </option>
                        )}
                      </For>
                    </select>
                    <button
                      class="btn-secondary px-3 text-xs"
                      onClick={() => runCmd('add_skill', { value: String(selectedSkillId()), level: 1 })}
                    >
                      <Plus size={14} /> Dar
                    </button>
                  </div>
                  <button
                    class="btn-subtle w-full py-1.5 text-xs mt-1"
                    onClick={() => runCmd('unlock', { all: true })}
                  >
                    Desbloquear todos los comandos de entrenamiento
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Support Bonds & Goals */}
          <div class="xl:col-span-5 space-y-4">
            <div class="surface-card p-5 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  Vínculos de Cartas de Soporte (Bonds)
                </span>
                <button
                  class="text-xs font-bold text-emerald-300 hover:underline"
                  onClick={async () => {
                    for (const b of state()?.bonds || []) {
                      await call('career.cmd', {
                        cmd: 'set_bond',
                        opts: { name: String(b.target_id), value: 100 },
                      });
                    }
                    notify('Todos los vínculos al máximo (100)');
                    await refreshCareer();
                  }}
                >
                  Todos a 100 (Arcoíris)
                </button>
              </div>

              <div class="space-y-2">
                <For each={state()?.bonds || []}>
                  {(b) => (
                    <div class="flex items-center justify-between gap-2 bg-black/25 border border-white/6 rounded-xl px-3 py-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <Show when={b.support_card_id}>
                          <img
                            src={getIconUrl('support', b.support_card_id)}
                            class="w-9 h-9 rounded-lg border border-white/10"
                            onError={(e) => (e.currentTarget.src = '/icon.png')}
                          />
                        </Show>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-white truncate">{b.name}</div>
                          <div class="text-[10px] text-[var(--text-muted)]">
                            Slot #{b.target_id} · Vínculo actual: {b.evaluation}/100
                          </div>
                        </div>
                      </div>
                      <button
                        class="btn-secondary py-1 px-2.5 text-xs"
                        onClick={() =>
                          runCmd('set_bond', { name: String(b.target_id), value: 100 })
                        }
                      >
                        Máx 100
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Route Goals */}
            <div class="surface-card p-5 space-y-3">
              <span class="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Objetivos de Ruta ({(state()?.goals || []).length})
              </span>
              <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                <For each={state()?.goals || []}>
                  {(g) => (
                    <div class="flex items-center justify-between gap-2 bg-black/25 border border-white/6 rounded-xl px-3 py-2">
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-white truncate">{g.what}</div>
                        <div class="text-[10px] text-[var(--text-muted)]">
                          Turno {g.turn} · Tipo: {g.kind}
                        </div>
                      </div>
                      <span class={`tiny-chip text-[10px] ${g.cleared ? 'turf' : 'gold'}`}>
                        {g.cleared ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  )}
                </For>
              </div>

              <div class="pt-3 border-t border-white/8 flex justify-end">
                <button
                  class="btn-danger py-2 px-4 text-xs"
                  onClick={() => runCmd('abandon', {}, { confirm: true })}
                >
                  <Trash2 size={14} /> Abandonar Carrera Activa
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

