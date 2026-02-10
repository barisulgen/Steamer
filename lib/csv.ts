import Papa from "papaparse";
import type { GameEntry } from "@/types/steam";

export function exportToCsv(
  data: GameEntry[],
  filename: string = "steamer_export.csv"
) {
  const rows = data.map((entry) => ({
    "App ID": entry.appid,
    Name: entry.name,
    Type: entry.type,
    Developers: entry.developers.join("; "),
    Publishers: entry.publishers.join("; "),
    "Game Website": entry.websiteUrl,
    "Developer Website": entry.developerWebsite,
    "Publisher Website": entry.publisherWebsite,
    Genres: entry.genres.join("; "),
    Tags: entry.tags.join("; "),
    "Release Date": entry.releaseDate,
    "Coming Soon": entry.comingSoon ? "Yes" : "No",
    "Price (Initial)":
      entry.priceInitialCents !== null
        ? (entry.priceInitialCents / 100).toFixed(2)
        : "",
    "Price (Final)":
      entry.priceFinalCents !== null
        ? (entry.priceFinalCents / 100).toFixed(2)
        : "",
    "Discount %": entry.discountPercent,
    Currency: entry.currency,
    Free: entry.isFree ? "Yes" : "No",
    Windows: entry.platformWindows ? "Yes" : "No",
    Mac: entry.platformMac ? "Yes" : "No",
    Linux: entry.platformLinux ? "Yes" : "No",
    Metacritic: entry.metacriticScore ?? "",
    Recommendations: entry.recommendations ?? "",
    Owners: entry.owners,
    CCU: entry.ccu ?? "",
    "Positive Reviews": entry.positiveReviews ?? "",
    "Negative Reviews": entry.negativeReviews ?? "",
    "Avg Playtime (min)": entry.averagePlaytime ?? "",
    Description: entry.shortDescription,
    "Header Image URL": entry.headerImage,
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
