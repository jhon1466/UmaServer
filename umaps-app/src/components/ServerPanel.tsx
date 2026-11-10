import { Show, createSignal, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  ArrowDownToLine,
  Check,
  Copy,
  FolderOpen,
  Gamepad2,
  LoaderCircle,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Square,
  Wrench,
} from 'lucide-solid';
import type { Language, ManagerProgress, ManagerStatus, Region } from '../types';
import { notify, refreshAll, setRegion } from '../api';

export default function ServerPanel(props: { language: Language; onStarted: () => void }) {
  const [status, setStatus] = createSignal<ManagerStatus>();
  const [prog, setProg] = createSignal<ManagerProgress>();
  const [working, setWorking] = createSignal(false);
  const [log, setLog] = createSignal('');
  const [host, setHost] = createSignal('127.0.0.1');
  const [gameDir, setGameDir] = createSignal('');
  let timer: number | undefined;
  let unlisten: (() => void) | undefined;

  const es = () => props.language === 'es';

  async function refresh() {
    try {
      const s = await invoke<ManagerStatus>('manager_status');
      setStatus(s);
      if (s.settings.publicHost) setHost(s.settings.publicHost);
      if (!gameDir() && s.settings.gameDir) setGameDir(s.settings.gameDir);
      const tail = await invoke<string>('manager_log_tail', { lines: 140 });
      setLog(tail);
    } catch {
      // Fallback if running outside Tauri webview
    }
  }

  async function run(action: () => Promise<unknown>, okMsg?: string) {
    setWorking(true);
    try {
      const r = await action();
      if (typeof r === 'string' && r) notify(r);
      else if (okMsg) notify(okMsg);
    } catch (e) {
      notify(String(e), true);
    } finally {
      setWorking(false);
      await refresh();
      await refreshAll();
    }
  }

  const startServer = () =>
    run(async () => {
      const msg = await invoke<string>('manager_start');
      setTimeout(() => {
        void refreshAll();
        props.onStarted();
      }, 1200);
      return msg;
    });

  const stopServer = () =>
    run(async () => {
      return await invoke<string>('manager_stop');
    });

  const setupAll = () =>
    run(async () => {
      return await invoke<string>('manager_setup');
    });

  const changeRegion = (next: Region) =>
    run(async () => {
      await invoke('manager_set_settings', { region: next, publicHost: host() });
      setRegion(next);
      return es() ? `Región cambiada a ${next.toUpperCase()}` : `Switched region to ${next.toUpperCase()}`;
    });

  function copyDiag() {
    const s = status();
    const lines = [
      `UmaPS Control Suite v${s?.appVersion ?? '1.0.0'} · region=${s?.settings.region ?? 'global'}`,
      `running=${s?.serverRunning} adminReady=${s?.adminReady} installed=${s?.installed}`,
      `venv=${s?.venvReady} cert=${s?.certReady} engines=${s?.enginesReady} assets=${s?.assetsReady} hachimi=${s?.patcherInGame}`,
      `gameDir=${s?.settings.gameDir ?? '-'}`,
      `repoRoot=${s?.repoRoot ?? '-'}`,
      '',
      log().split('\n').slice(-60).join('\n'),
    ];
    void navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => notify(es() ? 'Diagnóstico copiado al portapapeles' : 'Diagnostics copied'));
  }

  onMount(() => {
    void refresh();
    timer = window.setInterval(() => void refresh(), 2500);
    void listen<ManagerProgress>('manager-progress', (ev) => {
      setProg(ev.payload);
      if (ev.payload.stage === 'done' || ev.payload.stage === 'error') {
        void refresh();
        void refreshAll();
      }
    })
      .then((u) => (unlisten = u))
      .catch(() => undefined);
  });

  onCleanup(() => {
    if (timer) window.clearInterval(timer);
    unlisten?.();
  });

  const badgeText = () => {
    if (status()?.serverRunning) return es() ? 'Encendido' : 'Running';
    if (status()?.installed) return es() ? 'Detenido' : 'Stopped';
    return es() ? 'Requiere Instalación' : 'Setup Needed';
  };

  return (
    <div class="flex flex-col gap-5">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="section-title">
            {es() ? 'Servidor Local & Instalación Automática' : 'Local Server & Auto-Installer'}
          </h2>
          <p class="section-subtitle">
            {es()
              ? 'Instala el entorno Python, compila los motores Rust, extrae los circuitos del juego, configura Hachimi Edge e inicia UmaPS con un solo clic.'
              : 'Automatically sets up Python venv, builds Rust race engines, extracts game courses, configures Hachimi Edge and runs UmaPS.'}
          </p>
        </div>
        <span class={`tiny-chip ${status()?.serverRunning ? '' : 'muted-chip'}`}>
          <Server size={12} /> {badgeText()}
        </span>
      </div>

      {/* Main Control Card */}
      <section class="surface-card p-5">
        <div class="grid grid-cols-4 gap-4 text-[12px]">
          <div>
            <div class="card-caption">{es() ? 'Servidor del Juego' : 'Game Server'}</div>
            <div class="mt-1 flex items-center gap-2 text-[15px] font-extrabold">
              <span class={`status-dot ${status()?.serverRunning ? 'online' : ''}`} />
              {status()?.serverRunning
                ? `HTTPS :${status()?.gamePort ?? 8443}`
                : es()
                  ? 'Apagado'
                  : 'Offline'}
            </div>
          </div>

          <div>
            <div class="card-caption">{es() ? 'Motor API & SQLite' : 'API Worker & SQLite'}</div>
            <div class="mt-1 text-[15px] font-extrabold">
              {status()?.adminReady
                ? `Online (:${status()?.adminPort ?? 8189})`
                : es()
                  ? 'Detenido'
                  : 'Stopped'}
            </div>
          </div>

          <div>
            <div class="card-caption">{es() ? 'Estado de Componentes' : 'Components State'}</div>
            <div class="mt-1 text-[15px] font-extrabold text-gold-300">
              {status()?.installed
                ? es()
                  ? 'Listos y Verificados'
                  : 'Ready & Verified'
                : es()
                  ? 'Autoinstalación Lista'
                  : 'Auto-Setup Ready'}
            </div>
          </div>

          <div class="flex items-start justify-end gap-2">
            <Show
              when={status()?.serverRunning}
              fallback={
                <button class="primary-button" disabled={working()} onClick={() => void startServer()}>
                  {working() ? <LoaderCircle size={14} class="animate-spin" /> : <Play size={14} />}
                  {status()?.installed
                    ? es()
                      ? 'Iniciar Servidor'
                      : 'Start Server'
                    : es()
                      ? 'Instalar y Arrancar'
                      : 'Install & Start'}
                </button>
              }
            >
              <button class="danger-button" disabled={working()} onClick={() => void stopServer()}>
                <Square size={14} /> {es() ? 'Detener' : 'Stop'}
              </button>
            </Show>

            <button
              class="quiet-button"
              disabled={working()}
              onClick={() => void setupAll()}
              title={es() ? 'Verificar e instalar todos los componentes' : 'Verify and install all components'}
            >
              <RefreshCw size={14} class={working() ? 'animate-spin' : ''} />
              {es() ? 'Verificar Todo' : 'Verify All'}
            </button>
          </div>
        </div>

        {/* Component Readiness Pills */}
        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
          <StepPill label="Python .venv" ok={Boolean(status()?.venvReady)} />
          <StepPill label="Certificado TLS" ok={Boolean(status()?.certReady)} />
          <StepPill label="Motores Rust (Exact & Sim)" ok={Boolean(status()?.enginesReady)} />
          <StepPill label="Circuitos del Juego" ok={Boolean(status()?.assetsReady)} />
          <StepPill label="Hachimi Edge + Redirect DLL" ok={Boolean(status()?.patcherInGame)} />
        </div>

        <Show when={prog()}>
          <div class="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-3">
            <div class="flex items-center gap-2 text-[12px] font-bold">
              <Show when={working() || (prog()!.stage !== 'done' && prog()!.stage !== 'error')}>
                <LoaderCircle size={14} class="animate-spin text-turf-300" />
              </Show>
              <span class={prog()!.stage === 'error' ? 'text-rose-300' : 'text-ice-100'}>
                {prog()!.message}
              </span>
              <span class="ml-auto font-mono text-[11px] text-ice-500">
                {Math.round(prog()!.pct)}%
              </span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                class="h-full bg-gradient-to-r from-turf-400 to-gold-300 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(4, prog()!.pct))}%` }}
              />
            </div>
          </div>
        </Show>
      </section>

      {/* Region + Game Folder Cards */}
      <div class="grid grid-cols-2 gap-4">
        <section class="surface-card p-5">
          <h3 class="card-title flex items-center gap-2">
            <Wrench size={15} class="text-gold-300" />
            {es() ? 'Región del Servidor & Red' : 'Server Region & Network'}
          </h3>
          <p class="card-caption mb-3">
            {es()
              ? 'Selecciona la edición de Umamusume (Global en puerto 8443 o JP en puerto 8444).'
              : 'Select the Umamusume edition (Global on port 8443 or JP on port 8444).'}
          </p>

          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={working()}
              onClick={() => void changeRegion('global')}
              class={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                (status()?.settings.region ?? 'global') === 'global'
                  ? 'border-turf-400 bg-turf-400/12 text-white'
                  : 'border-white/10 bg-black/20 text-ice-300 hover:border-white/20'
              }`}
            >
              <div>
                <div class="text-xs font-extrabold">Global (Steam EN)</div>
                <div class="mt-0.5 text-[10px] text-ice-500">HTTPS :8443 · API :8189</div>
              </div>
              <Show when={(status()?.settings.region ?? 'global') === 'global'}>
                <Check size={15} class="text-turf-300" />
              </Show>
            </button>

            <button
              type="button"
              disabled={working()}
              onClick={() => void changeRegion('jp')}
              class={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                status()?.settings.region === 'jp'
                  ? 'border-gold-300 bg-gold-300/12 text-white'
                  : 'border-white/10 bg-black/20 text-ice-300 hover:border-white/20'
              }`}
            >
              <div>
                <div class="text-xs font-extrabold">Japan (JP Edition)</div>
                <div class="mt-0.5 text-[10px] text-ice-500">HTTPS :8444 · API :8190</div>
              </div>
              <Show when={status()?.settings.region === 'jp'}>
                <Check size={15} class="text-gold-300" />
              </Show>
            </button>
          </div>

          <div class="mt-4 flex gap-2">
            <input
              class="input-field flex-1 font-mono"
              value={host()}
              onInput={(e) => setHost(e.currentTarget.value)}
              placeholder="127.0.0.1"
            />
            <button
              class="secondary-button"
              onClick={() =>
                void run(
                  () =>
                    invoke('manager_set_settings', {
                      region: status()?.settings.region ?? 'global',
                      publicHost: host(),
                    }),
                  es() ? 'Configuración guardada' : 'Settings saved'
                )
              }
            >
              {es() ? 'Guardar IP' : 'Save Host'}
            </button>
          </div>
        </section>

        <section class="surface-card p-5">
          <h3 class="card-title flex items-center gap-2">
            <Gamepad2 size={15} class="text-turf-300" />
            {es() ? 'Cliente del Juego & Hachimi Edge' : 'Game Client & Hachimi Edge'}
            <span class={`tiny-chip ml-auto ${status()?.patcherInGame ? '' : 'gold-chip'}`}>
              {status()?.patcherInGame
                ? es()
                  ? 'Hachimi Instalado'
                  : 'Hachimi Patched'
                : es()
                  ? 'No Parcheado'
                  : 'Unpatched'}
            </span>
          </h3>
          <p class="card-caption mb-3">
            {es()
              ? 'Carpeta donde está UmamusumePrettyDerby.exe. Instala cri_mana_vpx.dll, hachimi_redirect.dll y redirect.cfg automáticamente.'
              : 'Folder containing UmamusumePrettyDerby.exe. Automatically installs cri_mana_vpx.dll, hachimi_redirect.dll and redirect.cfg.'}
          </p>

          <div class="flex gap-2">
            <input
              class="input-field flex-1 font-mono text-[11px]"
              placeholder="C:\Program Files (x86)\Steam\steamapps\common\UmamusumePrettyDerby"
              value={gameDir()}
              onInput={(e) => setGameDir(e.currentTarget.value)}
            />
            <button
              class="secondary-button"
              disabled={working() || !gameDir().trim()}
              onClick={() =>
                void run(() => invoke('manager_set_game_dir', { gameDir: gameDir() }))
              }
            >
              <ArrowDownToLine size={14} /> {es() ? 'Instalar Parche' : 'Install Patch'}
            </button>
          </div>

          <div class="mt-4 flex items-center gap-2.5">
            <button
              class="gold-button"
              disabled={!status()?.serverRunning}
              onClick={() => void run(() => invoke('manager_play'))}
              title={
                status()?.serverRunning
                  ? es()
                    ? 'Ejecutar Umamusume Pretty Derby'
                    : 'Launch Umamusume Pretty Derby'
                  : es()
                    ? 'Inicia primero el servidor local'
                    : 'Start the local server first'
              }
            >
              <Play size={14} /> {es() ? 'Jugar Umamusume' : 'Launch Game'}
            </button>

            <button
              class="quiet-button"
              onClick={() => void invoke('manager_open_folder', { kind: 'game' })}
            >
              <FolderOpen size={14} /> {es() ? 'Carpeta del Juego' : 'Game Folder'}
            </button>
          </div>
        </section>
      </div>

      {/* Live Server Log */}
      <section class="surface-card p-5">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3 class="card-title">{es() ? 'Registro del Servidor (logs/server.log)' : 'Server Log (logs/server.log)'}</h3>
            <p class="card-caption">
              {es()
                ? 'Salida en tiempo real del lanzador, compilador Rust y peticiones HTTPS del juego.'
                : 'Real-time output from the launcher, Rust compiler and game HTTPS requests.'}
            </p>
          </div>
          <div class="flex gap-2">
            <button class="quiet-button" onClick={() => void invoke('manager_open_folder', { kind: 'root' })}>
              <FolderOpen size={14} /> {es() ? 'Abrir Raíz UmaPS' : 'Open UmaPS Root'}
            </button>
            <button class="quiet-button" onClick={copyDiag}>
              <Copy size={14} /> {es() ? 'Copiar Diagnóstico' : 'Copy Diagnostics'}
            </button>
          </div>
        </div>
        <pre class="max-h-[250px] min-h-[160px] overflow-auto rounded-xl border border-white/[0.06] bg-black/35 p-3.5 font-mono text-[11px] leading-relaxed text-ice-300">
          {log() || (es() ? 'Esperando actividad del servidor…' : 'Waiting for server activity…')}
        </pre>
      </section>
    </div>
  );
}

function StepPill(props: { label: string; ok: boolean }) {
  return (
    <div
      class={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
        props.ok
          ? 'border-turf-400/30 bg-turf-400/10 text-turf-300'
          : 'border-white/10 bg-white/[0.03] text-ice-500'
      }`}
    >
      <ShieldCheck size={13} class={props.ok ? 'text-turf-300' : 'text-ice-500'} />
      <span>{props.label}</span>
    </div>
  );
}

