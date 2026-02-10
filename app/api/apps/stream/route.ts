import { NextRequest } from "next/server";
import {
  getAppDetails,
  getSteamSpyApp,
  getCompanyWebsite,
  normalizeStoreDetails,
  mergeSpyIntoEntry,
} from "@/lib/steam";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rawIds: unknown = body.ids;
  const withTags: boolean = body.withTags === true;
  const clientNames: Record<string, { developer: string; publisher: string }> =
    body.names ?? {};

  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return new Response("ids array required in request body", { status: 400 });
  }

  const ids = rawIds.map(Number).filter((n) => !isNaN(n));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let completed = 0;
      let failed = 0;

      for (const id of ids) {
        try {
          // Fetch Store details, and optionally SteamSpy in parallel
          const storePromise = getAppDetails(id);
          const spyPromise = withTags ? getSteamSpyApp(id) : Promise.resolve(null);
          const [details, spyData] = await Promise.all([storePromise, spyPromise]);

          if (details) {
            let entry = normalizeStoreDetails(details);
            if (spyData) {
              entry = mergeSpyIntoEntry(entry, spyData);
            }

            // Fetch developer & publisher websites from Wikidata in parallel
            const devName = entry.developers[0] ?? "";
            const pubName = entry.publishers[0] ?? "";
            const [devWebsite, pubWebsite] = await Promise.all([
              devName ? getCompanyWebsite(devName) : Promise.resolve(""),
              pubName && pubName !== devName
                ? getCompanyWebsite(pubName)
                : Promise.resolve(""),
            ]);
            entry.developerWebsite = devWebsite;
            entry.publisherWebsite = pubName === devName ? devWebsite : pubWebsite;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "app", entry })}\n\n`
              )
            );
          } else {
            // Store API failed — try Wikidata using SteamSpy or client-provided names
            let devName = "";
            let pubName = "";

            if (spyData) {
              devName = spyData.developer || "";
              pubName = spyData.publisher || "";
            } else if (clientNames[id]) {
              devName = clientNames[id].developer;
              pubName = clientNames[id].publisher;
            }

            if (devName || pubName) {
              const [devWebsite, pubWebsite] = await Promise.all([
                devName ? getCompanyWebsite(devName) : Promise.resolve(""),
                pubName && pubName !== devName
                  ? getCompanyWebsite(pubName)
                  : Promise.resolve(""),
              ]);

              if (devWebsite || pubWebsite) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "websites",
                      appid: id,
                      developerWebsite: devWebsite,
                      publisherWebsite: pubName === devName ? devWebsite : pubWebsite,
                    })}\n\n`
                  )
                );
              }
            }

            failed++;
          }
        } catch {
          failed++;
        }
        completed++;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "progress",
              completed,
              total: ids.length,
              failed,
            })}\n\n`
          )
        );
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "done", completed, failed })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
