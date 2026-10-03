# open-data relay (Cloudflare Worker)

Feeds the homepage's **Open data · live** card with the numbers that cannot be fetched from a visitor's browser:

| Value | Source | Why it needs a relay | Schedule |
|---|---|---|---|
| Aircraft tracked now | OpenSky Network `states/all` | CORS allows only opensky-network.org; anonymous cap 400 credits/day (4 per call) | every 20 min (288 credits/day) |
| Ships (Baltic AIS) | Fintraffic Digitraffic | browser-safe, but 600 KB → relayed as one number | every 20 min |
| Active satellites | CelesTrak `GROUP=active` | one download per IP per 2 h, several MB | every ~2 h |

`GET /summary` returns `{aircraft, ships, satellites, updated, errors}`; a failed source keeps its last good value and is listed in `errors`.
Solar wind / Kp, earthquakes, EONET and wave height are fetched directly by the browser (their APIs allow it).

Deploy: `npx wrangler deploy` (KV namespace id is in `wrangler.toml`). Manual refresh: `/refresh?key=$REFRESH_KEY[&sat=1]` (secret set with `wrangler secret put REFRESH_KEY`).
