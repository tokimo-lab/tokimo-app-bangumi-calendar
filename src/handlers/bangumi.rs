use axum::{extract::State, response::IntoResponse};
use serde::Deserialize;
use std::sync::Arc;

use crate::handlers::ok;
use crate::handlers::user::AuthUser;
use crate::AppState;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectListQuery {
    pub subject_type: u8,
    pub platform: Option<String>,
}

/// GET /api/bangumi/calendar
pub async fn get_calendar(
    State(state): State<Arc<AppState>>,
    AuthUser(_): AuthUser,
) -> impl IntoResponse {
    let data = state.bangumi.get_calendar().await;
    ok(data).into_response()
}

/// GET /api/bangumi/subjects?subjectType=1&platform=日剧
pub async fn get_subject_list(
    State(state): State<Arc<AppState>>,
    AuthUser(_): AuthUser,
    axum::extract::Query(query): axum::extract::Query<SubjectListQuery>,
) -> impl IntoResponse {
    let data = state
        .bangumi
        .get_subject_list(query.subject_type, query.platform.as_deref())
        .await;
    ok(data).into_response()
}
