// Cloudflare Pages Function: intercepts /p/{slug} requests from bots
// and returns HTML with OpenGraph meta tags for link previews.
// Human visitors get the normal SPA via env.ASSETS.fetch().

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Discordbot|WhatsApp|Telegram|Slack|iMessage|Applebot|Google-InspectionTool|Googlebot|bingbot|yandex|Pinterestbot|Embedly|Quora Link Preview|Showyou|outbrain|pinterest|vkShare|W3C_Validator/i;

const API_BASE = "https://api.proofofaiwork.com/api/v1";

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const ua = context.request.headers.get("user-agent") || "";

  // Human visitors get the SPA
  if (!BOT_UA.test(ua)) {
    return context.env.ASSETS.fetch(context.request);
  }

  const slug = context.params.slug as string;
  if (!slug) {
    return context.env.ASSETS.fetch(context.request);
  }

  try {
    const res = await fetch(`${API_BASE}/p/${slug}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return context.env.ASSETS.fetch(context.request);
    }

    const data: any = await res.json();

    const headline = data.headline || "AI Work Report";
    const publishedAt = data.published_at
      ? new Date(data.published_at).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        })
      : "";

    // Compute overall score from observations
    const observations: any[] = data.observations || [];
    const scored = observations.filter((o: any) => o.score !== null && !o.skipped);
    const avgScore = scored.length > 0
      ? Math.round(
          (scored.reduce((sum: number, o: any) => sum + o.score, 0) / scored.length) * 100
        )
      : null;

    const dimCount = scored.length;

    // Build description
    let description = "Verified AI work report from Proof of AI Work.";
    if (avgScore !== null) {
      description = `Overall score: ${avgScore}% across ${dimCount} dimensions.`;
      const strong = scored.filter((o: any) => o.label === "strong").length;
      if (strong > 0) {
        description += ` ${strong} strong rating${strong > 1 ? "s" : ""}.`;
      }
    }
    if (publishedAt) {
      description += ` Published ${publishedAt}.`;
    }

    const pageUrl = `https://proofofaiwork.com/p/${slug}`;
    const ogImageUrl = `https://api.proofofaiwork.com/api/v1/p/${slug}/og.png`;
    const title = headline.length > 70 ? headline.slice(0, 67) + "..." : headline;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)} - Proof of AI Work</title>
  <meta name="description" content="${esc(description)}" />

  <!-- OpenGraph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:site_name" content="Proof of AI Work" />
  <meta property="og:image" content="${esc(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(ogImageUrl)}" />

  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <p><a href="${esc(pageUrl)}">View full report on Proof of AI Work</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    // If API call fails, fall through to SPA
    return context.env.ASSETS.fetch(context.request);
  }
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
