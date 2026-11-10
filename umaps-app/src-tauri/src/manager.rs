use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub const APP_VERSION: &str = "1.0.0";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default = "default_region")]
    pub region: String,
    pub game_dir: Option<String>,
    #[serde(default = "default_host")]
    pub public_host: String,
}

fn default_region() -> String {
    "global".into()
}
fn default_host() -> String {
    "127.0.0.1".into()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            region: default_region(),
            game_dir: None,
            public_host: default_host(),
        }
    }
}

#[derive(Default)]
pub struct Manager {
    pub server: Mutex<Option<Child>>,
    pub busy: Mutex<bool>,
}

fn hidden(cmd: &mut Command) -> &mut Command {
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

pub fn repo_root() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        let mut cur = exe.parent().map(PathBuf::from);
        while let Some(dir) = cur {
            if dir.join("server").join("launcher.py").exists() {
                return dir;
            }
            cur = dir.parent().map(PathBuf::from);
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        let mut cur = Some(cwd);
        while let Some(dir) = cur {
            if dir.join("server").join("launcher.py").exists() {
                return dir;
            }
            cur = dir.parent().map(PathBuf::from);
        }
    }
    std::env::var_os("LOCALAPPDATA")
        .map(|p| PathBuf::from(p).join("UmaServer").join("project"))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

fn ensure_project(root: &Path, app: &AppHandle) -> Result<(), String> {
    if root.join("server").join("launcher.py").is_file() {
        return Ok(());
    }
    progress(app, "setup", 3.0, "Descargando los archivos del servidor…");
    #[cfg(windows)]
    {
        let script = r#"$ErrorActionPreference='Stop'
$tempDir = Join-Path $env:TEMP ('umaserver-install-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempDir | Out-Null
$archive = Join-Path $tempDir 'project.zip'
Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/jhon1466/UmaServer/archive/refs/heads/main.zip' -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $tempDir
$source = Join-Path $tempDir 'UmaServer-main'
if (!(Test-Path -LiteralPath (Join-Path $source 'server/launcher.py'))) { throw 'El archivo descargado no contiene el servidor.' }
New-Item -ItemType Directory -Force -Path $env:UMASERVER_PROJECT | Out-Null
Copy-Item -Path (Join-Path $source '*') -Destination $env:UMASERVER_PROJECT -Recurse -Force
$resolvedTemp = (Resolve-Path -LiteralPath $tempDir).Path
$tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
if ($resolvedTemp.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) { Remove-Item -LiteralPath $resolvedTemp -Recurse -Force }
"#;
        let output = hidden(Command::new("powershell.exe")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .env("UMASERVER_PROJECT", root))
            .output().map_err(|e| format!("No se pudo descargar el servidor: {e}"))?;
        if !output.status.success() {
            return Err(format!("No se pudieron preparar los archivos del servidor: {}", String::from_utf8_lossy(&output.stderr).trim()));
        }
        if !root.join("server").join("launcher.py").is_file() {
            return Err("La descarga no contiene el servidor esperado.".into());
        }
        return Ok(());
    }
    #[cfg(not(windows))]
    Err("Coloca la aplicación dentro de la carpeta del proyecto.".into())
}

fn settings_path() -> PathBuf {
    repo_root().join("server").join("manager_settings.json")
}

fn log_path() -> PathBuf {
    let dir = repo_root().join("logs");
    let _ = fs::create_dir_all(&dir);
    dir.join("server.log")
}

fn append_log(line: &str) {
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(log_path()) {
        let _ = writeln!(f, "{line}");
    }
}

pub fn load_settings() -> Settings {
    let mut s: Settings = fs::read_to_string(settings_path())
        .ok()
        .and_then(|txt| serde_json::from_str(&txt).ok())
        .unwrap_or_default();
    if s.game_dir.is_none() {
        if let Some(detected) = detect_game_dir(&s.region) {
            s.game_dir = Some(detected.display().to_string());
        }
    }
    s
}

pub fn save_settings(s: &Settings) -> Result<(), String> {
    let p = settings_path();
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_vec_pretty(s).map_err(|e| e.to_string())?;
    fs::write(p, json).map_err(|e| e.to_string())
}

fn progress(app: &AppHandle, stage: &str, pct: f64, message: impl Into<String>) {
    let msg = message.into();
    append_log(&format!("[{stage}] {msg}"));
    let _ = app.emit(
        "manager-progress",
        serde_json::json!({ "stage": stage, "pct": pct, "message": msg }),
    );
}

fn detect_game_dir(region: &str) -> Option<PathBuf> {
    let folder_name = if region == "jp" {
        "UmamusumePrettyDerby_Jpn"
    } else {
        "UmamusumePrettyDerby"
    };
    let exe_name = if region == "jp" {
        "UmamusumePrettyDerby_Jpn.exe"
    } else {
        "UmamusumePrettyDerby.exe"
    };

    let mut roots = vec![
        PathBuf::from(r"C:\Program Files (x86)\Steam"),
        PathBuf::from(r"C:\Program Files\Steam"),
        PathBuf::from(r"D:\SteamLibrary"),
        PathBuf::from(r"E:\SteamLibrary"),
    ];

    for r in roots.clone() {
        let vdf = r.join("steamapps").join("libraryfolders.vdf");
        if let Ok(txt) = fs::read_to_string(vdf) {
            for line in txt.lines() {
                let parts: Vec<&str> = line.trim().split('"').collect();
                if parts.len() >= 4 && parts[1] == "path" {
                    roots.push(PathBuf::from(parts[3].replace("\\\\", "\\")));
                }
            }
        }
    }

    for r in roots {
        let candidate = r.join("steamapps").join("common").join(folder_name);
        if candidate.join(exe_name).exists() {
            return Some(candidate);
        }
        let direct = r.join(folder_name);
        if direct.join(exe_name).exists() {
            return Some(direct);
        }
    }
    None
}

fn find_python(root: &Path) -> Option<PathBuf> {
    let venv_py = root.join("server").join(".venv").join("Scripts").join("python.exe");
    if venv_py.exists() {
        return Some(venv_py);
    }
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let programs = PathBuf::from(local).join("Programs").join("Python");
        for ver in ["Python314", "Python313", "Python312", "Python311"] {
            let candidate = programs.join(ver).join("python.exe");
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }
    for cmd in ["python", "python3"] {
        if let Ok(out) = hidden(Command::new(cmd).arg("--version")).output() {
            if out.status.success() {
                return Some(PathBuf::from(cmd));
            }
        }
    }
    None
}

fn port_open(port: u16) -> bool {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    TcpStream::connect_timeout(&addr, Duration::from_millis(250)).is_ok()
}

fn region_ports(region: &str) -> (u16, u16) {
    if region == "jp" {
        (8444, 8190)
    } else {
        (8443, 8189)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub app_version: String,
    pub repo_root: String,
    pub settings: Settings,
    pub venv_ready: bool,
    pub cert_ready: bool,
    pub engines_ready: bool,
    pub assets_ready: bool,
    pub patcher_in_game: bool,
    pub installed: bool,
    pub server_running: bool,
    pub admin_ready: bool,
    pub game_port: u16,
    pub admin_port: u16,
}

pub fn compute_status(m: &Manager) -> Status {
    let root = repo_root();
    let settings = load_settings();
    let (game_port, admin_port) = region_ports(&settings.region);

    // Reap exited child if any
    if let Ok(mut guard) = m.server.lock() {
        if let Some(child) = guard.as_mut() {
            if let Ok(Some(_)) = child.try_wait() {
                *guard = None;
            }
        }
    }

    let venv_ready = root
        .join("server")
        .join(".venv")
        .join("Scripts")
        .join("python.exe")
        .exists();
    let cert_name = if settings.region == "jp" { "jp" } else { "server" };
    let cert_ready = root
        .join("server")
        .join("certs")
        .join(format!("{cert_name}.cert.pem"))
        .exists();
    let engines_ready = root
        .join("server")
        .join("race_exact_rs")
        .join("target")
        .join("release")
        .join("race_exact_rs.exe")
        .exists()
        && root
            .join("server")
            .join("race_engine_rs")
            .join("target")
            .join("release")
            .join("race_engine_rs.exe")
            .exists();
    let asset_file = if settings.region == "jp" {
        "race_param_define.json"
    } else {
        "race_param_define_global.json"
    };
    let assets_ready = root.join("server").join("data").join(asset_file).exists();

    let patcher_in_game = settings.game_dir.as_deref().is_some_and(|d| {
        let g = Path::new(d);
        g.join("cri_mana_vpx.dll").exists()
            && g.join("hachimi").join("hachimi_redirect.dll").exists()
            && g.join("hachimi").join("redirect.cfg").exists()
    });

    let installed = venv_ready && cert_ready && engines_ready && assets_ready;
    let admin_ready = port_open(admin_port);
    let server_running = port_open(game_port) || admin_ready;

    Status {
        app_version: APP_VERSION.into(),
        repo_root: root.display().to_string(),
        settings,
        venv_ready,
        cert_ready,
        engines_ready,
        assets_ready,
        patcher_in_game,
        installed,
        server_running,
        admin_ready,
        game_port,
        admin_port,
    }
}

fn run_setup_sync(app: &AppHandle) -> Result<(), String> {
    let root = repo_root();
    ensure_project(&root, app)?;
    let settings = load_settings();
    let py = find_python(&root).ok_or_else(|| {
        "No se encontró Python 3.11+ en el sistema. Instala Python desde python.org.".to_string()
    })?;

    progress(
        app,
        "setup",
        10.0,
        "Iniciando verificación e instalación automática de UmaPS…",
    );

    let launcher = root.join("server").join("launcher.py");
    let mut cmd = Command::new(&py);
    hidden(&mut cmd);
    cmd.current_dir(&root)
        .arg(&launcher)
        .arg("--region")
        .arg(&settings.region)
        .arg("--yes")
        .arg("--setup-only");

    if let Some(ref gdir) = settings.game_dir {
        if !gdir.trim().is_empty() {
            cmd.arg("--game-dir").arg(gdir.trim());
        }
    }

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("No se pudo ejecutar launcher.py: {e}"))?;

    let stderr = child.stderr.take().map(|err| {
        let handle = app.clone();
        std::thread::spawn(move || {
            for line in BufReader::new(err).lines().map_while(Result::ok) {
                progress(&handle, "setup", 65.0, line);
            }
        })
    });

    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            append_log(&line);
            let trimmed = line.trim();
            if trimmed.starts_with("== Python environment") {
                progress(
                    app,
                    "venv",
                    20.0,
                    "Configurando entorno virtual Python y paquetes…",
                );
            } else if trimmed.starts_with("== TLS certificate") {
                progress(
                    app,
                    "cert",
                    40.0,
                    "Verificando certificados TLS para el servidor…",
                );
            } else if trimmed.starts_with("== Race engines") {
                progress(
                    app,
                    "rust",
                    55.0,
                    "Verificando motores de simulación de carreras (Rust)…",
                );
            } else if trimmed.starts_with("== Game install") {
                progress(
                    app,
                    "assets",
                    72.0,
                    "Extrayendo circuitos y assets desde la instalación del juego…",
                );
            } else if trimmed.starts_with("== Hachimi Edge") {
                progress(
                    app,
                    "hachimi",
                    88.0,
                    "Instalando Hachimi Edge y configurando plugin de redirección…",
                );
            } else if trimmed.starts_with("== Setup complete") {
                progress(
                    app,
                    "done",
                    100.0,
                    "Entorno, motores y parche Hachimi configurados correctamente.",
                );
            } else if !trimmed.is_empty() {
                progress(app, "setup", 65.0, trimmed.to_string());
            }
        }
    }

    let status = child.wait().map_err(|e| e.to_string())?;
    if let Some(t) = stderr { let _ = t.join(); }
    if !status.success() {
        return Err(
            format!("El proceso de configuración automática terminó con {status}. Revisa el registro inferior."),
        );
    }
    Ok(())
}

fn kill_port_processes(port: u16) {
    #[cfg(windows)]
    {
        let script = format!(
            "Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {{ Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }}"
        );
        let _ = hidden(Command::new("powershell").args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            &script,
        ]))
        .status();
    }
}

pub fn shutdown(m: &Manager) {
    if let Ok(mut guard) = m.server.lock() {
        if let Some(mut child) = guard.take() {
            #[cfg(windows)]
            {
                let pid = child.id();
                let _ = hidden(Command::new("taskkill").args([
                    "/F",
                    "/T",
                    "/PID",
                    &pid.to_string(),
                ]))
                .status();
            }
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

#[tauri::command]
pub fn manager_status(m: State<'_, Manager>) -> Status {
    compute_status(&m)
}

#[tauri::command]
pub async fn manager_setup(app: AppHandle, m: State<'_, Manager>) -> Result<String, String> {
    {
        let mut b = m.busy.lock().unwrap();
        if *b {
            return Err("Ya hay una operación en curso.".into());
        }
        *b = true;
    }
    let app_clone = app.clone();
    let res = tokio::task::spawn_blocking(move || run_setup_sync(&app_clone))
        .await
        .map_err(|e| e.to_string())?;
    *m.busy.lock().unwrap() = false;
    match res {
        Ok(()) => {
            progress(
                &app,
                "done",
                100.0,
                "Todo instalado y configurado automáticamente.",
            );
            Ok("Instalación y parcheo completados.".into())
        }
        Err(err) => {
            progress(&app, "error", 0.0, &err);
            Err(err)
        }
    }
}

#[tauri::command]
pub async fn manager_start(app: AppHandle, m: State<'_, Manager>) -> Result<String, String> {
    let st = compute_status(&m);
    if st.server_running && st.admin_ready {
        return Ok("El servidor ya está en ejecución.".into());
    }

    {
        let mut b = m.busy.lock().unwrap();
        if *b {
            return Err("Ya hay una operación en curso.".into());
        }
        *b = true;
    }

    let result: Result<String, String> = async {
        // Ensure setup is complete before launching
        let app_for_setup = app.clone();
        tokio::task::spawn_blocking(move || run_setup_sync(&app_for_setup))
            .await
            .map_err(|e| e.to_string())??;

        let root = repo_root();
        let settings = load_settings();
        let (game_port, admin_port) = region_ports(&settings.region);

        // If already running after setup, we're good
        if port_open(game_port) && port_open(admin_port) {
            return Ok("Servidor activo y conectado.".into());
        }

        progress(&app, "start", 92.0, "Iniciando servidor UmaPS y panel API…");

        let venv_py = root
            .join("server")
            .join(".venv")
            .join("Scripts")
            .join("python.exe");
        let py = if venv_py.exists() {
            venv_py
        } else {
            find_python(&root).ok_or("No se encontró Python.")?
        };

        let log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_path())
            .map_err(|e| e.to_string())?;
        let log_err = log_file.try_clone().map_err(|e| e.to_string())?;

        let mut cmd = Command::new(&py);
        hidden(&mut cmd);
        cmd.current_dir(&root)
            .env("UMA_NO_BROWSER", "1")
            .env("PYTHONUNBUFFERED", "1")
            .arg(root.join("server").join("launcher.py"))
            .arg("--region")
            .arg(&settings.region)
            .arg("--yes")
            .arg("--no-browser");

        if let Some(ref gdir) = settings.game_dir {
            if !gdir.trim().is_empty() {
                cmd.arg("--game-dir").arg(gdir.trim());
            }
        }

        cmd.stdout(Stdio::from(log_file))
            .stderr(Stdio::from(log_err))
            .stdin(Stdio::null());

        let child = cmd
            .spawn()
            .map_err(|e| format!("Error al lanzar el servidor: {e}"))?;
        *m.server.lock().unwrap() = Some(child);

        // Wait up to 15 seconds for both ports
        for _ in 0..30 {
            tokio::time::sleep(Duration::from_millis(500)).await;
            if port_open(admin_port) && port_open(game_port) {
                progress(
                    &app,
                    "done",
                    100.0,
                    format!(
                        "Servidor UmaPS ({}) activo en https://127.0.0.1:{}",
                        settings.region.to_uppercase(),
                        game_port
                    ),
                );
                return Ok("Servidor iniciado correctamente.".into());
            }
        }

        Err("El servidor tardó demasiado en abrir los puertos. Revisa el registro.".into())
    }
    .await;

    *m.busy.lock().unwrap() = false;
    if let Err(ref err) = result {
        progress(&app, "error", 0.0, err.clone());
    }
    result
}

#[tauri::command]
pub fn manager_stop(app: AppHandle, m: State<'_, Manager>) -> Result<String, String> {
    let settings = load_settings();
    let (game_port, admin_port) = region_ports(&settings.region);
    shutdown(&m);
    kill_port_processes(game_port);
    kill_port_processes(admin_port);
    progress(&app, "done", 100.0, "Servidor detenido.");
    Ok("Servidor detenido.".into())
}

#[tauri::command]
pub fn manager_set_settings(region: String, public_host: String) -> Result<(), String> {
    let mut s = load_settings();
    if region == "global" || region == "jp" {
        s.region = region;
    }
    let host = public_host.trim();
    s.public_host = if host.is_empty() {
        default_host()
    } else {
        host.to_string()
    };
    save_settings(&s)
}

#[tauri::command]
pub async fn manager_set_game_dir(
    app: AppHandle,
    m: State<'_, Manager>,
    game_dir: String,
) -> Result<String, String> {
    let dir = game_dir.trim().trim_matches('"').to_string();
    let p = Path::new(&dir);
    if !p.join("UmamusumePrettyDerby.exe").exists()
        && !p.join("UmamusumePrettyDerby_Jpn.exe").exists()
    {
        return Err("En esa carpeta no se encontró UmamusumePrettyDerby.exe.".into());
    }
    let mut s = load_settings();
    s.game_dir = Some(dir);
    save_settings(&s)?;
    manager_setup(app, m).await
}

#[tauri::command]
pub fn manager_play() -> Result<(), String> {
    let s = load_settings();
    let dir = s
        .game_dir
        .ok_or("Primero selecciona o detecta la carpeta del juego.")?;
    let exe_name = if s.region == "jp" {
        "UmamusumePrettyDerby_Jpn.exe"
    } else {
        "UmamusumePrettyDerby.exe"
    };
    let exe = Path::new(&dir).join(exe_name);
    if !exe.exists() {
        return Err(format!("No se encontró {exe_name} en {dir}"));
    }
    Command::new(&exe)
        .current_dir(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("No se pudo iniciar el juego: {e}"))
}

#[tauri::command]
pub fn manager_log_tail(lines: Option<usize>) -> String {
    let text = fs::read_to_string(log_path()).unwrap_or_default();
    let n = lines.unwrap_or(160);
    let all: Vec<&str> = text.lines().collect();
    all[all.len().saturating_sub(n)..].join("\n")
}

#[tauri::command]
pub fn manager_open_folder(kind: Option<String>) {
    let target = match kind.as_deref() {
        Some("game") => load_settings()
            .game_dir
            .map(PathBuf::from)
            .unwrap_or_else(repo_root),
        _ => repo_root(),
    };
    let _ = Command::new("explorer").arg(target).spawn();
}

