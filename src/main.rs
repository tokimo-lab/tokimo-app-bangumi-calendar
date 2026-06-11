//! Bangumi Calendar app — resident sidecar with embedded axum + UDS.
//!
//! Routes (proxied by host at `/api/apps/bangumi-calendar/<rest>`):
//! - `GET /assets/{*path}` → embedded UI assets

const MANIFEST: &str = include_str!("../tokimo-app.toml");

mod app_server;
mod assets;
mod cli;

use clap::{Parser, Subcommand};
use tokimo_bus_cli::TokimoAuthArgs;
use tokimo_bus_client::{BusClient, ClientConfig};
use tracing::{error, info};

#[derive(Parser, Debug)]
#[command(
    name = "tokimo-app-bangumi-calendar",
    about = "Bangumi Calendar — Tokimo 子 app CLI",
    long_about = "Bangumi Calendar CLI — browse daily anime broadcast calendar and tracking info.",
    term_width = 100
)]
struct Cli {
    #[command(flatten)]
    auth: TokimoAuthArgs,
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Print app version info
    Version,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let Cli { auth: _, command } = Cli::parse();

    match command {
        None if std::env::var_os("TOKIMO_BUS_SOCKET").is_some() => {
            tracing_subscriber::fmt()
                .with_env_filter(
                    tracing_subscriber::EnvFilter::try_from_default_env()
                        .unwrap_or_else(|_| "info,tokimo_app_bangumi_calendar=debug".into()),
                )
                .init();
            if let Err(e) = run_server().await {
                error!(%e, "bangumi-calendar: fatal");
                std::process::exit(1);
            }
        }
        None => {
            use clap::CommandFactory;
            let mut cmd = Cli::command();
            tokimo_bus_cli::print_help_unified(&mut cmd);
            std::process::exit(0);
        }
        Some(Command::Version) => {
            println!("tokimo-app-bangumi-calendar {}", env!("CARGO_PKG_VERSION"));
        }
    }

    Ok(())
}

async fn run_server() -> anyhow::Result<()> {
    let cfg = ClientConfig::from_env().map_err(|e| anyhow::anyhow!("ClientConfig: {e}"))?;
    info!(endpoint = ?cfg.endpoint, "bangumi-calendar: connecting to broker");

    let app_socket = app_server::spawn("bangumi-calendar")
        .await
        .map_err(|e| anyhow::anyhow!("app_server spawn: {e}"))?;

    let client = BusClient::builder(cfg)
        .service("bangumi-calendar", env!("CARGO_PKG_VERSION"))
        .data_plane(app_socket)
        .build()
        .await
        .map_err(|e| anyhow::anyhow!("bus build: {e}"))?;

    info!("bangumi-calendar: registered with broker");

    let shutdown = {
        let client = std::sync::Arc::clone(&client);
        tokio::spawn(async move { client.run_until_shutdown().await })
    };

    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            info!("bangumi-calendar: SIGINT received");
            client.shutdown();
        }
        _ = shutdown => info!("bangumi-calendar: broker sent Shutdown"),
    }

    Ok(())
}
