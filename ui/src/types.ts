export interface BangumiImages {
  large?: string;
  common?: string;
  medium?: string;
  small?: string;
  grid?: string;
}

export interface BangumiRating {
  total?: number;
  score?: number;
}

export interface BangumiAnime {
  id: number;
  name: string;
  nameCn: string;
  summary?: string;
  airDate?: string;
  airWeekday: number;
  platform?: string;
  eps?: number;
  volumes?: number;
  images?: BangumiImages;
  rating?: BangumiRating;
  rank?: number;
  doing?: number;
  collect?: number;
  url?: string;
}

export interface BangumiCalendarDay {
  weekday: number;
  weekdayCn: string;
  weekdayEn: string;
  items: BangumiAnime[];
}
