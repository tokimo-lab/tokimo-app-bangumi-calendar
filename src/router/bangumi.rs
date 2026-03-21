use axum::{routing::get, Router};
use std::sync::Arc;

use crate::handlers::bangumi;
use crate::AppState;

pub fn build_bangumi_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/bangumi/calendar", get(bangumi::get_calendar))
        .route("/api/bangumi/subjects", get(bangumi::get_subject_list))
}
