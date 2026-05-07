// Tauri 桌面壳仅包装 WebView，当前只启用 shell plugin（用于外部链接打开）。
// 如需更深入的桌面集成（文件系统、通知等），可按需添加 plugin。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
