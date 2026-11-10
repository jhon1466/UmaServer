import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import {
  Award,
  Coins,
  Copy,
  Gem,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Zap,
  Download,
  Upload,
} from 'lucide-solid';
import {
  call,
  catalog,
  connected,
  currentViewer,
  getIconUrl,
  language,
  loadUsers,
  notify,
  selectViewer,
  usersList,
} from '../../api';
import type { UserDetail } from '../../types';

export default function AccountsPanel() {
  const es = () => language() === 'es';
  const [query, setQuery] = createSignal('');
  const [detail, setDetail] = createSignal<UserDetail | null>(null);
  const [loading, setLoading] = createSignal(false);

  // Profile fields
  const [name, setName] = createSignal('');
  const [comment, setComment] = createSignal('');
  const [sex, setSex] = createSignal(1);
  const [birthDay, setBirthDay] = createSignal('');
  const [honorId, setHonorId] = createSignal(0);
  const [leaderCharaId, setLeaderCharaId] = createSignal(1001);

  // Wallet fields
  const [fcoin, setFcoin] = createSignal(0);
  const [coin, setCoin] = createSignal(0);
  const [money, setMoney] = createSignal(0);
  const [tp, setTp] = createSignal(100);
  const [maxTp, setMaxTp] = createSignal(100);
  const [rp, setRp] = createSignal(5);
  const [maxRp, setMaxRp] = createSignal(5);

  // Account management fields
  const [newVid, setNewVid] = createSignal('');
  const [copySource, setCopySource] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [importText, setImportText] = createSignal('');
  const [importMode, setImportMode] = createSignal<'merge' | 'replace'>('merge');

  async function exportSave() {
    try {
      const data = await call<any>('save.export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `umaps-save-${currentViewer()}.json`; a.click();
      URL.revokeObjectURL(url);
      notify('Partida exportada');
    } catch (e: any) { notify(e.message, true); }
  }

  async function importSave() {
    try {
      await call('save.import', { data: importText(), mode: importMode() });
      setImportText(''); notify('Partida importada'); await fetchDetail();
    } catch (e: any) { notify(e.message, true); }
  }

  const filteredUsers = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return usersList();
    return usersList().filter(
      (u) => u.id.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
    );
  });

  async function fetchDetail(vid = currentViewer()) {
    if (!vid || !connected()) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      const d = await call<UserDetail>('users.detail', {}, { targetViewer: vid });
      setDetail(d);
      setName(d.profile?.name || '');
      setComment(d.profile?.comment || '');
      setSex(d.profile?.sex || 1);
      setBirthDay(d.profile?.birth_day || '');
      setHonorId(d.profile?.honor_id || 0);
      setLeaderCharaId(d.profile?.leader_chara_id || 1001);

      setFcoin(d.wallet?.fcoin ?? 0);
      setCoin(d.wallet?.coin ?? 0);
      setMoney(d.money ?? 0);
      setTp(d.tp?.current_tp ?? 100);
      setMaxTp(d.tp?.max_tp ?? 100);
      setRp(d.rp?.current_rp ?? 5);
      setMaxRp(d.rp?.max_rp ?? 5);
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    if (currentViewer() && connected()) {
      void fetchDetail(currentViewer());
    }
  });

  async function saveProfile() {
    try {
      await call('users.profile', {
        name: name().trim(),
        comment: comment(),
        sex: sex(),
        birth_day: birthDay(),
        honor_id: honorId(),
        leader_chara_id: leaderCharaId(),
      });
      notify(es() ? 'Perfil de entrenador actualizado' : 'Trainer profile saved');
      await loadUsers();
      await fetchDetail();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function saveWallet(override?: { fcoin: number; coin: number; money: number; tp: number; rp: number }) {
    try {
      const payload = override || {
        fcoin: fcoin(),
        coin: coin(),
        money: money(),
        tp: tp(),
        max_tp: maxTp(),
        rp: rp(),
        max_rp: maxRp(),
      };
      await call('wallet.set', payload);
      notify(es() ? 'Billetera y recursos guardados' : 'Wallet updated');
      await loadUsers();
      await fetchDetail();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function createAccount() {
    const vid = newVid().trim();
    if (!vid) return;
    try {
      await call('users.new', {}, { targetViewer: vid });
      setNewVid('');
      selectViewer(vid);
      await loadUsers();
      await fetchDetail(vid);
      notify(es() ? `Cuenta ${vid} creada` : `Created account ${vid}`);
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function copyAccount() {
    const src = copySource().trim();
    if (!src || !currentViewer()) return;
    try {
      await call('users.copy', { source: src, overwrite: true });
      notify(es() ? `Guardado copiado desde ${src}` : `Copied save from ${src}`);
      await loadUsers();
      await fetchDetail();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function deleteAccount() {
    const vid = currentViewer();
    if (!vid) return;
    const confirmText = window.prompt(
      es()
        ? `Escribe el Viewer ID (${vid}) para confirmar el borrado definitivo de la cuenta:`
        : `Type the Viewer ID (${vid}) to confirm permanent deletion:`
    );
    if (confirmText !== vid) return;
    try {
      await call('users.delete', { confirm: vid, account_row: true });
      notify(es() ? `Cuenta ${vid} eliminada` : `Deleted account ${vid}`);
      selectViewer('');
      await loadUsers();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  async function applyPassword() {
    if (!password().trim()) return;
    try {
      await call('users.set_password', { password: password().trim() });
      setPassword('');
      notify(es() ? 'Contraseña de transferencia guardada' : 'Transfer password set');
      await fetchDetail();
    } catch (e: any) {
      notify(e.message, true);
    }
  }

  return (
    <div class="flex flex-col gap-5">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="section-title">
            {es() ? 'Administración de Entrenadores & Billetera' : 'Trainer Accounts & Wallet'}
          </h2>
          <p class="section-subtitle">
            {es()
              ? 'Gestiona las cuentas del servidor, edita el perfil público, modifica joyas/mani y clona partidas.'
              : 'Manage server accounts, edit trainer profiles, modify carats/mani and clone saves.'}
          </p>
        </div>
        <button class="quiet-button" onClick={() => { void loadUsers(); void fetchDetail(); }}>
          <RefreshCw size={14} /> {es() ? 'Actualizar' : 'Refresh'}
        </button>
      </div>

      <div class="surface-card p-3 flex flex-wrap items-center gap-2">
        <button class="btn-secondary" onClick={exportSave}><Download size={14} /> Exportar partida</button>
        <select class="select-input !w-40" value={importMode()} onChange={e => setImportMode(e.currentTarget.value as any)}><option value="merge">Combinar partida</option><option value="replace">Reemplazar partida</option></select>
        <textarea class="code-editor min-h-10 flex-1" rows="1" placeholder="Pega aquí un JSON de save para importar" value={importText()} onInput={e => setImportText(e.currentTarget.value)} />
        <button class="btn-gold" disabled={!importText().trim()} onClick={importSave}><Upload size={14} /> Importar</button>
        <Show when={usersList().length > 1}><select class="select-input !w-48" value={copySource()} onChange={e => setCopySource(e.currentTarget.value)}><option value="">Copiar partida desde…</option><For each={usersList().filter(u => u.id !== currentViewer())}>{u => <option value={u.id}>{u.name || `Viewer ${u.id}`} · {u.id}</option>}</For></select><button class="btn-secondary" disabled={!copySource()} onClick={copyAccount}>Copiar save</button></Show>
      </div>

      <div class="grid grid-cols-[.82fr_1.18fr] gap-4">
        {/* Left: Accounts List & Create */}
        <section class="surface-card flex flex-col overflow-hidden">
          <div class="border-b border-white/[0.06] p-4">
            <div class="flex gap-2">
              <div class="search-field">
                <Search size={14} />
                <input
                  placeholder={es() ? 'Buscar por nombre o Viewer ID…' : 'Search name or Viewer ID…'}
                  value={query()}
                  onInput={(e) => setQuery(e.currentTarget.value)}
                />
              </div>
            </div>

            {/* New account row */}
            <div class="mt-3 flex gap-2">
              <input
                class="input-field flex-1 font-mono"
                placeholder={es() ? 'Nuevo Viewer ID (ej. 100000001)' : 'New Viewer ID (e.g. 100000001)'}
                value={newVid()}
                onInput={(e) => setNewVid(e.currentTarget.value)}
              />
              <button class="primary-button" disabled={!newVid().trim()} onClick={() => void createAccount()}>
                <UserPlus size={14} /> {es() ? 'Crear' : 'Create'}
              </button>
            </div>
          </div>

          <div class="max-h-[560px] flex-1 overflow-y-auto">
            <Show
              when={filteredUsers().length > 0}
              fallback={
                <div class="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-xs text-ice-500">
                  <Users size={22} />
                  <span>{es() ? 'No hay cuentas registradas.' : 'No accounts found.'}</span>
                </div>
              }
            >
              <For each={filteredUsers()}>
                {(u) => (
                  <button
                    type="button"
                    class={`account-row ${currentViewer() === u.id ? 'selected' : ''}`}
                    onClick={() => selectViewer(u.id)}
                  >
                    <img
                      src={getIconUrl('chara', u.leader || 1001)}
                      alt=""
                      class="size-10 shrink-0 rounded-xl border border-gold-300/30 bg-ink-950 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/icon.png';
                      }}
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <b class="truncate text-xs font-extrabold text-ice-100">
                          {u.name || `Viewer ${u.id}`}
                        </b>
                        <Show when={u.career}>
                          <span class="tiny-chip">T{u.career?.turn}</span>
                        </Show>
                      </div>
                      <small class="mt-0.5 block font-mono text-[10px] text-ice-500">
                        ID {u.id} · {u.umas ?? 0} Umas · {u.supports ?? 0} Soportes
                      </small>
                    </div>
                    <div class="text-right font-mono text-[10px] text-gold-300">
                      <div>{((u.fcoin ?? 0) + (u.coin ?? 0)).toLocaleString()} Carats</div>
                      <div class="text-ice-500">{Math.round((u.bytes ?? 0) / 1024)} KB</div>
                    </div>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </section>

        {/* Right: Selected Account Profile & Wallet */}
        <div class="flex flex-col gap-4">
          <Show
            when={detail()}
            fallback={
              <section class="surface-card flex min-h-[380px] flex-col items-center justify-center gap-3 p-8 text-center text-xs text-ice-500">
                <Users size={26} />
                <span>
                  {loading()
                    ? es()
                      ? 'Cargando perfil del entrenador…'
                      : 'Loading trainer profile…'
                    : es()
                      ? 'Selecciona una cuenta de la lista izquierda.'
                      : 'Select an account on the left.'}
                </span>
              </section>
            }
          >
            {(d) => (
              <>
                {/* Summary Strip */}
                <section class="surface-card p-5">
                  <div class="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div class="flex items-center gap-3.5">
                      <img
                        src={getIconUrl('chara', d().profile?.leader_chara_id || 1001)}
                        alt=""
                        class="size-12 rounded-xl border border-gold-300/40 bg-ink-950 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/icon.png';
                        }}
                      />
                      <div>
                        <div class="text-[10px] font-extrabold uppercase tracking-[.16em] text-turf-300">
                          {es() ? 'Licencia Oficial Academia Tracen' : 'Official Tracen Academy License'}
                        </div>
                        <h3 class="mt-0.5 text-lg font-black text-white">
                          {d().profile?.name || `Viewer ${d().id}`}
                        </h3>
                        <div class="font-mono text-[11px] text-ice-500">UID {d().id}</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <Show when={d().best_veteran}>
                        <span class="tiny-chip gold-chip">
                          <Award size={12} /> {d().best_veteran?.rank} · {d().best_veteran?.score}
                        </span>
                      </Show>
                      <button class="danger-button" onClick={() => void deleteAccount()}>
                        <Trash2 size={14} /> {es() ? 'Eliminar' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 grid grid-cols-4 gap-2.5">
                    <div class="metric-tile">
                      <span>{es() ? 'Umas' : 'Umas'}</span>
                      <b>{d().counts.umas}</b>
                    </div>
                    <div class="metric-tile">
                      <span>{es() ? 'Soportes' : 'Supports'}</span>
                      <b>{d().counts.supports}</b>
                    </div>
                    <div class="metric-tile">
                      <span>{es() ? 'Veteranas' : 'Veterans'}</span>
                      <b>{d().counts.veterans}</b>
                    </div>
                    <div class="metric-tile">
                      <span>{es() ? 'Canciones / Buzón' : 'Songs / Mail'}</span>
                      <b>
                        {d().counts.music} / {d().counts.mail_unclaimed}
                      </b>
                    </div>
                  </div>
                </section>

                {/* Wallet & Energy Card */}
                <section class="surface-card p-5">
                  <div class="mb-4 flex items-center justify-between">
                    <div>
                      <h3 class="card-title flex items-center gap-2">
                        <Coins size={15} class="text-gold-300" />
                        {es() ? 'Billetera, Joyas (Carats) & Energía' : 'Wallet, Carats & Energy'}
                      </h3>
                      <p class="card-caption">
                        {es()
                          ? 'Modifica zanahorias gratuitas/pagadas, Mani y puntos TP/RP.'
                          : 'Edit free/paid carats, Mani currency and TP/RP stamina.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="gold-button"
                      onClick={() => {
                        setFcoin(999999);
                        setCoin(999999);
                        setMoney(99999999);
                        setTp(999);
                        setRp(99);
                        void saveWallet({ fcoin: 999999, coin: 999999, money: 99999999, tp: 999, rp: 99 });
                      }}
                    >
                      <Sparkles size={14} /> {es() ? 'Max Recursos (999K)' : 'Max Resources (999K)'}
                    </button>
                  </div>

                  <div class="grid grid-cols-3 gap-3">
                    <label class="field-label">
                      <span class="flex items-center gap-1.5 text-turf-300">
                        <Gem size={12} /> {es() ? 'Joyas Gratis (Free)' : 'Free Carats'}
                      </span>
                      <input
                        type="number"
                        class="input-field font-mono"
                        value={fcoin()}
                        onInput={(e) => setFcoin(Number(e.currentTarget.value))}
                      />
                    </label>

                    <label class="field-label">
                      <span class="flex items-center gap-1.5 text-gold-300">
                        <Gem size={12} /> {es() ? 'Joyas de Pago (Paid)' : 'Paid Carats'}
                      </span>
                      <input
                        type="number"
                        class="input-field font-mono"
                        value={coin()}
                        onInput={(e) => setCoin(Number(e.currentTarget.value))}
                      />
                    </label>

                    <label class="field-label">
                      <span class="flex items-center gap-1.5 text-gold-300">
                        <Coins size={12} /> {es() ? 'Mani (Monedas)' : 'Mani (Gold)'}
                      </span>
                      <input
                        type="number"
                        class="input-field font-mono"
                        value={money()}
                        onInput={(e) => setMoney(Number(e.currentTarget.value))}
                      />
                    </label>

                    <label class="field-label">
                      <span class="flex items-center gap-1.5">
                        <Zap size={12} /> {es() ? 'TP Actual' : 'Current TP'}
                      </span>
                      <input
                        type="number"
                        class="input-field font-mono"
                        value={tp()}
                        onInput={(e) => setTp(Number(e.currentTarget.value))}
                      />
                    </label>

                    <label class="field-label">
                      <span>{es() ? 'RP Actual (Team Trials)' : 'Current RP'}</span>
                      <input
                        type="number"
                        class="input-field font-mono"
                        value={rp()}
                        onInput={(e) => setRp(Number(e.currentTarget.value))}
                      />
                    </label>

                    <div class="flex items-end">
                      <button class="primary-button w-full" onClick={() => void saveWallet()}>
                        <Save size={14} /> {es() ? 'Guardar Billetera' : 'Save Wallet'}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Trainer Profile & Account Actions */}
                <section class="surface-card p-5">
                  <h3 class="card-title mb-3 flex items-center gap-2">
                    <ShieldCheck size={15} class="text-turf-300" />
                    {es() ? 'Editar Perfil & Acciones de Cuenta' : 'Edit Profile & Account Actions'}
                  </h3>

                  <div class="grid grid-cols-2 gap-3">
                    <label class="field-label">
                      {es() ? 'Nombre del Entrenador' : 'Trainer Name'}
                      <input
                        class="input-field"
                        value={name()}
                        onInput={(e) => setName(e.currentTarget.value)}
                      />
                    </label>

                    <label class="field-label">
                      {es() ? 'Comentario / Estado' : 'Profile Comment'}
                      <input
                        class="input-field"
                        value={comment()}
                        onInput={(e) => setComment(e.currentTarget.value)}
                      />
                    </label>

                    <label class="field-label">
                      {es() ? 'Título / Honor' : 'Title / Honor'}
                      <select
                        class="input-field"
                        value={honorId()}
                        onChange={(e) => setHonorId(Number(e.currentTarget.value))}
                      >
                        <option value={0}>—</option>
                        <For each={catalog()?.misc?.honors.slice(0, 300) || []}>
                          {(h) => <option value={h.id}>{h.name} (#{h.id})</option>}
                        </For>
                      </select>
                    </label>

                    <div class="flex items-end">
                      <button class="primary-button w-full" onClick={() => void saveProfile()}>
                        <Save size={14} /> {es() ? 'Guardar Perfil' : 'Save Profile'}
                      </button>
                    </div>
                  </div>

                  {/* Clone & Transfer Password */}
                  <div class="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                    <div class="flex gap-2">
                      <select
                        class="input-field flex-1"
                        value={copySource()}
                        onChange={(e) => setCopySource(e.currentTarget.value)}
                      >
                        <option value="">
                          {es() ? 'Clonar progreso desde otra cuenta…' : 'Clone save from account…'}
                        </option>
                        <For each={usersList().filter((u) => u.id !== currentViewer())}>
                          {(u) => (
                            <option value={u.id}>
                              {u.name || u.id} ({u.id})
                            </option>
                          )}
                        </For>
                      </select>
                      <button
                        class="secondary-button"
                        disabled={!copySource()}
                        onClick={() => void copyAccount()}
                      >
                        <Copy size={14} /> {es() ? 'Clonar' : 'Clone'}
                      </button>
                    </div>

                    <div class="flex gap-2">
                      <input
                        type="password"
                        class="input-field flex-1"
                        placeholder={es() ? 'Contraseña de transferencia…' : 'Transfer password…'}
                        value={password()}
                        onInput={(e) => setPassword(e.currentTarget.value)}
                      />
                      <button
                        class="secondary-button"
                        disabled={!password().trim()}
                        onClick={() => void applyPassword()}
                      >
                        <KeyRound size={14} /> {es() ? 'Asignar Clave' : 'Set Password'}
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}

