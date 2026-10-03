/* Open-data relay for the followorbounce.github.io homepage ("Open data · live").
 *
 * Some live sources cannot be called from a visitor's browser:
 *   - OpenSky only allows its own origin (CORS), and anonymous use is capped at 400 credits/day;
 *   - CelesTrak allows one download of a group per IP every 2 hours and the file is several MB.
 * So a cron trigger fetches them on a schedule that respects those limits, keeps only the numbers,
 * and serves one tiny JSON document to every visitor.
 *
 *   GET /summary  -> {"aircraft":{count,asOf,source},"ships":{...},"satellites":{...},"updated":ISO}
 */
const UA = 'followorbounce.github.io open-data relay (https://followorbounce.github.io/)';
const SAT_EVERY_MS = 2 * 3600 * 1000 + 5 * 60 * 1000;   // CelesTrak: once per 2 h per IP

function count(text, needle) {
  let n = 0, i = text.indexOf(needle);
  while (i !== -1) { n++; i = text.indexOf(needle, i + needle.length); }
  return n;
}

async function aircraft() {
  const r = await fetch('https://opensky-network.org/api/states/all', { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('OpenSky ' + r.status);
  const t = await r.text();
  const time = /"time"\s*:\s*(\d+)/.exec(t);
  // every state vector is an array that starts with the icao24 string: '["'
  return { count: count(t, '["'), asOf: time ? new Date(+time[1] * 1000).toISOString() : new Date().toISOString(), source: 'OpenSky Network' };
}

async function ships() {
  const r = await fetch('https://meri.digitraffic.fi/api/ais/v1/locations', { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Digitraffic-User': 'followorbounce.github.io' } });
  if (!r.ok) throw new Error('Digitraffic ' + r.status);
  const t = await r.text();
  const upd = /"dataUpdatedTime"\s*:\s*"([^"]+)"/.exec(t);
  return { count: count(t, '"mmsi"'), asOf: upd ? upd[1] : new Date().toISOString(), source: 'Fintraffic Digitraffic (Baltic AIS)' };
}

async function satellites() {
  const r = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('CelesTrak ' + r.status);
  const t = await r.text();
  // three-line elements: one "1 " line per object
  const n = count(t, '\n1 ') + (t.startsWith('1 ') ? 1 : 0);
  if (n < 1000) throw new Error('CelesTrak: unexpected payload');
  return { count: n, asOf: new Date().toISOString(), source: 'CelesTrak (active satellites)' };
}

async function refresh(env, forceSat) {
  const cur = JSON.parse((await env.OPEN_DATA.get('summary')) || '{}');
  const jobs = { ships: ships() };   // aircraft arrive via POST /ingest (see README)
  const satAge = cur.satellites ? Date.now() - Date.parse(cur.satellites.fetched || cur.satellites.asOf) : Infinity;
  if (forceSat || satAge > SAT_EVERY_MS) jobs.satellites = satellites();
  const keys = Object.keys(jobs), res = await Promise.allSettled(keys.map(k => jobs[k]));
  const errors = {};
  res.forEach((r, i) => {
    const k = keys[i];
    if (r.status === 'fulfilled') cur[k] = Object.assign(r.value, { fetched: new Date().toISOString() });
    else errors[k] = String(r.reason && r.reason.message || r.reason);   // keep the last good value
  });
  cur.updated = new Date().toISOString();
  cur.errors = errors;
  await env.OPEN_DATA.put('summary', JSON.stringify(cur));
  return cur;
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(refresh(env, false)); },
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/summary') {
      const v = (await env.OPEN_DATA.get('summary')) || '{}';
      return new Response(v, { headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' }, CORS) });
    }
    // OpenSky refuses Cloudflare's network, so a GitHub Actions job fetches it and posts just the count here
    if (url.pathname === '/ingest' && req.method === 'POST' && env.REFRESH_KEY && req.headers.get('X-Key') === env.REFRESH_KEY) {
      let body; try { body = await req.json(); } catch (e) { return new Response('bad json', { status: 400 }); }
      const a = body && body.aircraft;
      if (!a || !Number.isInteger(a.count) || a.count < 100 || a.count > 50000 || isNaN(Date.parse(a.asOf))) return new Response('bad aircraft', { status: 400 });
      const cur = JSON.parse((await env.OPEN_DATA.get('summary')) || '{}');
      cur.aircraft = { count: a.count, asOf: new Date(Date.parse(a.asOf)).toISOString(), source: 'OpenSky Network', fetched: new Date().toISOString() };
      if (cur.errors) delete cur.errors.aircraft;
      await env.OPEN_DATA.put('summary', JSON.stringify(cur));
      return new Response(JSON.stringify(cur.aircraft), { headers: Object.assign({ 'Content-Type': 'application/json' }, CORS) });
    }
    if (url.pathname === '/refresh' && env.REFRESH_KEY && url.searchParams.get('key') === env.REFRESH_KEY) {
      const v = await refresh(env, url.searchParams.get('sat') === '1');
      return new Response(JSON.stringify(v), { headers: Object.assign({ 'Content-Type': 'application/json' }, CORS) });
    }
    return new Response('Not found', { status: 404, headers: CORS });
  }
};
