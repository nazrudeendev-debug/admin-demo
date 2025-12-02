import { load } from "cheerio";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdminScraper/1.0)",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch page: ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const html = await res.text();
    const $ = load(html);
    console.log(html);
    const specs = [];
    const seen = new Set();

    // Helper to push deduped key/value
    function pushKV(category, k, v) {
      if (!k || !v) return;
      const key = String(k).trim();
      const val = String(v).trim();
      if (!key || !val) return;
      const id = `${category}::${key}::${val}`;
      if (seen.has(id)) return;
      seen.add(id);
      specs.push({ category, spec_key: key, spec_value: val });
    }

    // Try tables (common for specs)
    $("table").each((i, table) => {
      const heading =
        $(table).prevAll("h1,h2,h3,h4").first().text().trim() || "Scraped";
      $(table)
        .find("tr")
        .each((j, tr) => {
          const cols = $(tr)
            .find("th, td")
            .map((k, el) => $(el).text().trim())
            .get();
          if (cols.length >= 2) {
            const k = cols[0];
            const v = cols.slice(1).join(" | ");
            pushKV(heading || "Scraped", k, v);
          }
        });
    });

    // Try definition lists
    $("dl").each((i, dl) => {
      const heading =
        $(dl).prevAll("h1,h2,h3,h4").first().text().trim() || "Scraped";
      $(dl)
        .children("dt")
        .each((j, dt) => {
          const dd = $(dt).next("dd");
          pushKV(heading, $(dt).text(), dd.text());
        });
    });

    // Try headings + next sibling lists (common pattern)
    $("h2, h3, h4").each((i, h) => {
      const heading = $(h).text().trim();
      // next table
      const nextTable = $(h).nextAll("table").first();
      if (nextTable && nextTable.length) return; // already processed in table pass
      // next lists
      const nextUl = $(h).nextAll("ul, ol").first();
      if (nextUl && nextUl.length) {
        nextUl.find("li").each((j, li) => {
          const text = $(li).text().trim();
          // split on ':' or '—' or ' - '
          const parts = text.split(/[:—\-–]\s*/);
          if (parts.length >= 2) {
            pushKV(heading || "Scraped", parts[0], parts.slice(1).join(" | "));
          }
        });
      }
    });

    // Generic fallback: parse list items with key:value
    $("li").each((i, li) => {
      const text = $(li).text().trim();
      const parts = text.split(/[:—\-–]\s*/);
      if (parts.length >= 2) {
        pushKV("Scraped", parts[0], parts.slice(1).join(" | "));
      }
    });

    // If nothing found, attempt meta tags and title
    if (specs.length === 0) {
      const title = $("title").text().trim();
      if (title) pushKV("Page", "title", title);
      const description = $('meta[name="description"]').attr("content");
      if (description) pushKV("Page", "description", description);
    }

    // Limit results to 500 items to be safe
    const limited = specs.slice(0, 500);

    return new Response(JSON.stringify({ specs: limited }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
