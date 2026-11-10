import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { language, connected, checkConnection, refreshAll, serverUrl, notice } from '../api';
import ServerPanel from './ServerPanel';

export default function TracenApp() {
  const [view, setView] = createSignal<'admin' | 'server'>('admin');
  let timer: number | undefined;

  onMount(() => {
    void refreshAll();
    timer = window.setInterval(() => { void checkConnection(); }, 4000);
  });
  onCleanup(() => { if (timer) window.clearInterval(timer); });

  return <div class="desktop-app">
    <header class="desktop-toolbar">
      <div class="desktop-brand"><img src="/icon.png" alt="" /><strong>UmaPS Admin</strong></div>
      <div class="desktop-actions">
        <button class={`desktop-tab ${view() === 'admin' ? 'selected' : ''}`} onClick={() => setView('admin')}>Panel de administración</button>
        <button class={`desktop-tab ${view() === 'server' ? 'selected' : ''}`} onClick={() => setView('server')}>Servidor y juego</button>
      </div>
      <span class={`desktop-connection ${connected() ? 'online' : ''}`}><i />{connected() ? 'Panel conectado' : 'Panel desconectado'}</span>
    </header>
    <Show when={view() === 'admin'}>
      <Show when={connected()} fallback={<div class="desktop-offline"><h1>Panel de administración</h1><p>Inicia el servidor para cargar las cuentas y herramientas.</p><button class="desktop-tab selected" onClick={() => setView('server')}>Abrir servidor y juego</button></div>}>
        <iframe title="Panel de administración de UmaPS" class="desktop-frame" src={`${serverUrl()}/`} />
      </Show>
    </Show>
    <Show when={view() === 'server'}>
      <main class="desktop-server"><ServerPanel language={language()} onStarted={() => { void refreshAll(); setView('admin'); }} /></main>
    </Show>
    <Show when={notice()}>{n => <div class={`toast ${n().error ? 'toast-error' : ''}`}>{n().text}</div>}</Show>
  </div>;
}
