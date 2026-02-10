// ===== RAW API RESPONSE TYPES =====

/** Steam Web API: ISteamApps/GetAppList/v2 */
export interface SteamAppListResponse {
  applist: {
    apps: SteamAppListEntry[];
  };
}

export interface SteamAppListEntry {
  appid: number;
  name: string;
}

/** Steam Store API: appdetails response wrapper */
export interface SteamAppDetailsResponse {
  [appid: string]: {
    success: boolean;
    data?: SteamAppDetails;
  };
}

export interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  detailed_description: string;
  short_description: string;
  header_image: string;
  background: string;
  developers?: string[];
  publishers?: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories?: Array<{ id: number; description: string }>;
  genres?: Array<{ id: string; description: string }>;
  screenshots?: Array<{ id: number; path_thumbnail: string; path_full: string }>;
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  recommendations?: {
    total: number;
  };
  website?: string;
}

/** SteamSpy API response for a single app */
export interface SteamSpyAppData {
  appid: number;
  name: string;
  developer: string;
  publisher: string;
  score_rank: string;
  positive: number;
  negative: number;
  userscore: number;
  owners: string;
  average_forever: number;
  average_2weeks: number;
  median_forever: number;
  median_2weeks: number;
  price: string;
  initialprice: string;
  discount: string;
  ccu: number;
  languages: string;
  genre: string;
  tags: Record<string, number>;
}

export type SteamSpyBulkResponse = Record<string, SteamSpyAppData>;

// ===== NORMALIZED APPLICATION TYPES =====

/** The unified game record the table displays and the user can edit */
export interface GameEntry {
  appid: number;
  name: string;
  type: string;
  headerImage: string;
  shortDescription: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags: string[];
  releaseDate: string;
  comingSoon: boolean;
  priceInitialCents: number | null;
  priceFinalCents: number | null;
  discountPercent: number;
  currency: string;
  isFree: boolean;
  platformWindows: boolean;
  platformMac: boolean;
  platformLinux: boolean;
  metacriticScore: number | null;
  recommendations: number | null;
  owners: string;
  ccu: number | null;
  positiveReviews: number | null;
  negativeReviews: number | null;
  averagePlaytime: number | null;
  websiteUrl: string;
  developerWebsite: string;
  publisherWebsite: string;
  detailLevel: "minimal" | "steamspy" | "full";
}

/** Search/filter parameters sent from client to API routes */
export interface SearchFilters {
  query?: string;
  genres?: string[];
  tags?: string[];
  developers?: string[];
  publishers?: string[];
  releaseDateFrom?: string;
  releaseDateTo?: string;
  priceMin?: number;
  priceMax?: number;
  platformWindows?: boolean;
  platformMac?: boolean;
  platformLinux?: boolean;
  isFree?: boolean;
  onlyDiscounted?: boolean;
}

/** Browse mode selection */
export type BrowseMode =
  | { type: "top100in2weeks" }
  | { type: "top100forever" }
  | { type: "genre"; genre: string }
  | { type: "tag"; tag: string };

