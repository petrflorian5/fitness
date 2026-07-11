/**
 * Fitness Tracker — Cloudflare Worker
 * Dělá dvě věci:
 *   1. Úložiště dat (KV) — GET/PUT /data
 *   2. Proxy na Anthropic API — POST /chat (API klíč nikdy neopustí server)
 *
 * Potřebné secrets (nastavíš v Cloudflare dashboardu, viz NÁVOD.md):
 *   ANTHROPIC_API_KEY  — tvůj klíč z console.anthropic.com
 *   APP_TOKEN          — tvoje heslo k appce (vymysli si libovolný delší řetězec)
 * Potřebný KV binding:
 *   TRACKER_KV         — KV namespace pro data
 */

const ALLOWED_ORIGINS = [
  'https://petrflorian5.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // — Auth: všechny endpointy vyžadují Bearer token —
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!env.APP_TOKEN || token !== env.APP_TOKEN) {
      return json({ error: 'unauthorized' }, 401, cors);
    }

    try {
      // — Data: čtení —
      if (url.pathname === '/data' && request.method === 'GET') {
        const raw = await env.TRACKER_KV.get('data');
        return new Response(raw || '{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      // — Data: zápis —
      if (url.pathname === '/data' && request.method === 'PUT') {
        const body = await request.text();
        if (body.length > 5_000_000) return json({ error: 'too large' }, 413, cors);
        JSON.parse(body); // validace
        await env.TRACKER_KV.put('data', body);
        return json({ ok: true, savedAt: new Date().toISOString() }, 200, cors);
      }

      // — Chat: proxy na Anthropic Messages API —
      if (url.pathname === '/chat' && request.method === 'POST') {
        const payload = await request.json();
        // klient posílá { model?, system, messages, tools?, max_tokens? }
        const body = {
          model: payload.model || 'claude-sonnet-5',
          max_tokens: Math.min(payload.max_tokens || 2048, 8192),
          system: payload.system,
          messages: payload.messages,
        };
        if (payload.tools) body.tools = payload.tools;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      return json({ error: 'not found' }, 404, cors);
    } catch (e) {
      return json({ error: String(e.message || e) }, 500, cors);
    }
  },
};
