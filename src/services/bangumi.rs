use std::sync::Arc;

use rust_client_api::metadata_providers::bangumi::{
    BangumiCalendarDay as RawCalendarDay, BangumiCalendarItem, BangumiClient, BangumiConfig,
    BangumiImages as RawImages, BangumiRating as RawRating, BangumiSearchItem,
};
use serde::Serialize;
use tracing::error;

// ── Output types (camelCase for frontend) ───────────────────────────────────

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BangumiImages {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub large: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub common: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub medium: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub small: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grid: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BangumiRating {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score: Option<f64>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BangumiAnime {
    pub id: i64,
    pub name: String,
    pub name_cn: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub air_date: Option<String>,
    pub air_weekday: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eps: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub volumes: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<BangumiImages>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rating: Option<BangumiRating>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rank: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub doing: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collect: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BangumiCalendarDay {
    pub weekday: u32,
    pub weekday_cn: String,
    pub weekday_en: String,
    pub items: Vec<BangumiAnime>,
}

// ── Service ─────────────────────────────────────────────────────────────────

pub struct BangumiService {
    client: BangumiClient,
}

impl BangumiService {
    pub fn new() -> Self {
        Self {
            client: BangumiClient::new(BangumiConfig {
                access_token: None,
                base_url: None,
                user_agent: None,
                cache_ttl: None,
            }),
        }
    }

    /// 获取动画每日放送（按星期分组）
    pub async fn get_calendar(&self) -> Vec<BangumiCalendarDay> {
        match self.client.get_calendar().await {
            Ok(raw) => raw.into_iter().map(to_calendar_day).collect(),
            Err(e) => {
                error!("Failed to fetch Bangumi calendar: {e}");
                Vec::new()
            }
        }
    }

    /// 按类型获取热门条目（书籍/游戏/音乐/三次元）
    pub async fn get_subject_list(
        &self,
        subject_type: u8,
        platform: Option<&str>,
    ) -> Vec<BangumiAnime> {
        match self.client.browse_subjects(subject_type, 100).await {
            Ok(items) => {
                let converted: Vec<BangumiAnime> =
                    items.into_iter().map(to_anime_from_search).collect();
                match platform {
                    Some(p) => converted
                        .into_iter()
                        .filter(|item| item.platform.as_deref() == Some(p))
                        .collect(),
                    None => converted,
                }
            }
            Err(e) => {
                error!(
                    "Failed to fetch Bangumi subject list (type={subject_type}, platform={}): {e}",
                    platform.unwrap_or("all")
                );
                Vec::new()
            }
        }
    }
}

// ── Conversion helpers ──────────────────────────────────────────────────────

fn weekday_cn(id: u32) -> &'static str {
    match id {
        1 => "星期一",
        2 => "星期二",
        3 => "星期三",
        4 => "星期四",
        5 => "星期五",
        6 => "星期六",
        7 => "星期日",
        _ => "",
    }
}

fn weekday_en(id: u32) -> &'static str {
    match id {
        1 => "Mon",
        2 => "Tue",
        3 => "Wed",
        4 => "Thu",
        5 => "Fri",
        6 => "Sat",
        7 => "Sun",
        _ => "",
    }
}

fn to_images(raw: Option<RawImages>) -> Option<BangumiImages> {
    raw.map(|img| BangumiImages {
        large: img.large,
        common: img.common,
        medium: img.medium,
        small: img.small,
        grid: img.grid,
    })
}

fn to_rating(raw: Option<&RawRating>) -> Option<BangumiRating> {
    raw.map(|r| BangumiRating {
        total: Some(r.total),
        score: Some(r.score),
    })
}

fn to_calendar_day(raw: RawCalendarDay) -> BangumiCalendarDay {
    let weekday_id = raw.weekday.id;
    BangumiCalendarDay {
        weekday: weekday_id,
        weekday_cn: raw
            .weekday
            .cn
            .unwrap_or_else(|| weekday_cn(weekday_id).to_string()),
        weekday_en: raw
            .weekday
            .en
            .unwrap_or_else(|| weekday_en(weekday_id).to_string()),
        items: raw
            .items
            .into_iter()
            .map(|item| to_anime_from_calendar(item, weekday_id))
            .collect(),
    }
}

fn to_anime_from_calendar(item: BangumiCalendarItem, weekday_id: u32) -> BangumiAnime {
    let name = item.name.unwrap_or_default();
    let name_cn = item.name_cn.unwrap_or_else(|| name.clone());
    BangumiAnime {
        id: item.id,
        name,
        name_cn,
        summary: item.summary,
        air_date: item.air_date,
        air_weekday: item.air_weekday.unwrap_or(weekday_id),
        platform: None,
        eps: None,
        volumes: None,
        images: to_images(item.images),
        rating: to_rating(item.rating.as_ref()),
        rank: item.rank,
        doing: item.collection.as_ref().and_then(|c| c.doing),
        collect: None,
        url: item.url,
    }
}

fn to_anime_from_search(item: BangumiSearchItem) -> BangumiAnime {
    let name = item.name;
    let name_cn = if item.name_cn.is_empty() {
        name.clone()
    } else {
        item.name_cn
    };
    BangumiAnime {
        id: item.id,
        name,
        name_cn,
        summary: item.summary,
        air_date: item.date.or(item.air_date),
        air_weekday: 0,
        platform: item.platform,
        eps: item.total_episodes.or(item.eps),
        volumes: item.volumes,
        images: to_images(item.images),
        rating: to_rating(item.rating.as_ref()),
        rank: item.rating.as_ref().and_then(|r| r.rank).or(item.rank),
        doing: item.collection.as_ref().and_then(|c| c.doing),
        collect: item.collection.as_ref().and_then(|c| c.collect),
        url: Some(format!("https://bgm.tv/subject/{}", item.id)),
    }
}

/// Create a shared BangumiService wrapped in Arc.
pub fn create_bangumi_service() -> Arc<BangumiService> {
    Arc::new(BangumiService::new())
}
