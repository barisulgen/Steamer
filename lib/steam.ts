import { RateLimiter } from "./rate-limiter";
import { LRUCache } from "./cache";
import type {
  SteamAppListResponse,
  SteamAppDetailsResponse,
  SteamAppDetails,
  SteamSpyAppData,
  SteamSpyBulkResponse,
  GameEntry,
} from "@/types/steam";

const STEAM_API_KEY = process.env.STEAM_API_KEY!;
const steamLimiter = new RateLimiter(180, 5 * 60 * 1000);
const steamSpyLimiter = new RateLimiter(4, 60 * 1000);
const appDetailsCache = new LRUCache<SteamAppDetails>(10000);
const steamSpyCache = new LRUCache<SteamSpyAppData>(10000);

// ===== App List (cached in module scope) =====

let appListCache: {
  data: Array<{ appid: number; name: string }>;
  expiry: number;
} | null = null;

export async function getAppList(): Promise<
  Array<{ appid: number; name: string }>
> {
  if (appListCache && Date.now() < appListCache.expiry) {
    return appListCache.data;
  }
  const res = await fetch(
    `https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${STEAM_API_KEY}`
  );
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const json: SteamAppListResponse = await res.json();
  const apps = json.applist.apps.filter((a) => a.name.trim() !== "");
  appListCache = { data: apps, expiry: Date.now() + 24 * 60 * 60 * 1000 };
  return apps;
}

// ===== Steam Store API =====

export async function getAppDetails(
  appid: number
): Promise<SteamAppDetails | null> {
  const cached = appDetailsCache.get(String(appid));
  if (cached) return cached;

  await steamLimiter.acquire();
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const json: SteamAppDetailsResponse = await res.json();
    const entry = json[String(appid)];
    if (!entry?.success || !entry.data) return null;

    appDetailsCache.set(String(appid), entry.data);
    return entry.data;
  } catch {
    return null;
  }
}

export async function getAppDetailsBatch(
  appids: number[],
  onProgress?: (completed: number, total: number, failed: number) => void
): Promise<Map<number, SteamAppDetails>> {
  const results = new Map<number, SteamAppDetails>();
  let completed = 0;
  let failed = 0;

  for (const appid of appids) {
    try {
      const details = await getAppDetails(appid);
      if (details) {
        results.set(appid, details);
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
    completed++;
    onProgress?.(completed, appids.length, failed);
  }

  return results;
}

// ===== SteamSpy API =====

export async function getSteamSpyApp(
  appid: number
): Promise<SteamSpyAppData | null> {
  const cached = steamSpyCache.get(String(appid));
  if (cached) return cached;

  await steamSpyLimiter.acquire();
  try {
    const res = await fetch(
      `https://steamspy.com/api.php?request=appdetails&appid=${appid}`
    );
    if (!res.ok) return null;
    const data: SteamSpyAppData = await res.json();
    steamSpyCache.set(String(appid), data);
    return data;
  } catch {
    return null;
  }
}

export async function getSteamSpyBulk(
  mode: "all" | "top100in2weeks" | "top100forever" | "genre" | "tag",
  value?: string
): Promise<SteamSpyAppData[]> {
  await steamSpyLimiter.acquire();
  let url = `https://steamspy.com/api.php?request=${mode}`;
  if (mode === "genre" && value)
    url += `&genre=${encodeURIComponent(value)}`;
  if (mode === "tag" && value) url += `&tag=${encodeURIComponent(value)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SteamSpy error: ${res.status}`);
  const json: SteamSpyBulkResponse = await res.json();
  return Object.values(json);
}

// ===== Normalization =====

export function normalizeStoreDetails(d: SteamAppDetails): GameEntry {
  return {
    appid: d.steam_appid,
    name: d.name,
    type: d.type,
    headerImage: d.header_image,
    shortDescription: d.short_description,
    developers: d.developers ?? [],
    publishers: d.publishers ?? [],
    genres: d.genres?.map((g) => g.description) ?? [],
    tags: [],
    releaseDate: d.release_date.date,
    comingSoon: d.release_date.coming_soon,
    priceInitialCents: d.price_overview?.initial ?? null,
    priceFinalCents: d.price_overview?.final ?? null,
    discountPercent: d.price_overview?.discount_percent ?? 0,
    currency: d.price_overview?.currency ?? "USD",
    isFree: d.is_free,
    platformWindows: d.platforms.windows,
    platformMac: d.platforms.mac,
    platformLinux: d.platforms.linux,
    metacriticScore: d.metacritic?.score ?? null,
    recommendations: d.recommendations?.total ?? null,
    owners: "",
    ccu: null,
    positiveReviews: null,
    negativeReviews: null,
    averagePlaytime: null,
    detailLevel: "full",
  };
}

export function normalizeSteamSpyData(d: SteamSpyAppData): GameEntry {
  const tagNames = Object.keys(d.tags || {});
  const genreList = d.genre
    ? d.genre
        .split(", ")
        .map((g) => g.trim())
        .filter(Boolean)
    : [];
  return {
    appid: d.appid,
    name: d.name,
    type: "game",
    headerImage: `https://cdn.akamai.steamstatic.com/steam/apps/${d.appid}/header.jpg`,
    shortDescription: "",
    developers: d.developer ? [d.developer] : [],
    publishers: d.publisher ? [d.publisher] : [],
    genres: genreList,
    tags: tagNames,
    releaseDate: "",
    comingSoon: false,
    priceInitialCents: d.initialprice ? parseInt(d.initialprice, 10) : null,
    priceFinalCents: d.price ? parseInt(d.price, 10) : null,
    discountPercent: d.discount ? parseInt(d.discount, 10) : 0,
    currency: "USD",
    isFree: d.price === "0",
    platformWindows: true,
    platformMac: false,
    platformLinux: false,
    metacriticScore: null,
    recommendations: null,
    owners: d.owners,
    ccu: d.ccu,
    positiveReviews: d.positive,
    negativeReviews: d.negative,
    averagePlaytime: d.average_forever,
    detailLevel: "steamspy",
  };
}

export function mergeSpyIntoEntry(
  entry: GameEntry,
  spy: SteamSpyAppData
): GameEntry {
  return {
    ...entry,
    tags: Object.keys(spy.tags || {}),
    owners: spy.owners,
    ccu: spy.ccu,
    positiveReviews: spy.positive,
    negativeReviews: spy.negative,
    averagePlaytime: spy.average_forever,
  };
}
