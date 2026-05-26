# tokimo-app-bangumi-calendar

Tokimo Bangumi (anime) release calendar — standalone multi-process app.

## Features

- Daily broadcast schedule grouped by weekday
- Browse trending subjects: anime, books, games, music, dramas
- Data from [Bangumi (bgm.tv)](https://bgm.tv) via Tokimo server proxy

## Architecture

Follows the Tokimo multi-process app pattern (方案 3):
- **Rust binary** (`tokimo-app-bangumi-calendar`): resident sidecar, hosts embedded axum server on a Unix socket, serves static UI assets
- **UI** (`ui/`): React 19 + Vite, built into `ui/dist/`, calls back to the Tokimo host server at `/api/apps/bangumi/*` for Bangumi API data

## Development

```bash
# Build UI
cd ui && pnpm install && pnpm build

# Build Rust binary (from monorepo root)
cargo build -p tokimo-app-bangumi-calendar

# Run Rust binary (help)
cargo run -p tokimo-app-bangumi-calendar -- --help
```

## License

MIT OR Apache-2.0
