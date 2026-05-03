use std::process::Command;
use std::thread;
use std::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // In production, start the Next.js server from bundled resources
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app.path().resource_dir().expect("resource dir");
                let server_dir = resource_dir.join("standalone");
                let server_script = server_dir.join("server.js");

                if server_script.exists() {
                    std::process::Command::new("node")
                        .arg(&server_script)
                        .current_dir(&server_dir)
                        .env("PORT", "4317")
                        .env("HOSTNAME", "127.0.0.1")
                        .env("NODE_ENV", "production")
                        .stdout(std::process::Stdio::null())
                        .stderr(std::process::Stdio::null())
                        .spawn()
                        .ok();

                    // Wait for server to be ready
                    for _ in 0..20 {
                        thread::sleep(Duration::from_millis(500));
                        if std::net::TcpStream::connect("127.0.0.1:4317").is_ok() {
                            break;
                        }
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
