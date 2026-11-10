pub mod manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(manager::Manager::default())
        .invoke_handler(tauri::generate_handler![
            manager::manager_status,
            manager::manager_setup,
            manager::manager_start,
            manager::manager_stop,
            manager::manager_set_settings,
            manager::manager_set_game_dir,
            manager::manager_play,
            manager::manager_log_tail,
            manager::manager_open_folder,
        ])
        .build(tauri::generate_context!())
        .expect("error while building UmaPS Tracen Control")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                use tauri::Manager;
                manager::shutdown(&app.state::<manager::Manager>());
            }
        });
}
