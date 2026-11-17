/**
 * General mailer for arkastro.be — DigitalOcean Functions + Resend.
 *
 * POST https://mailer.arkastro.be/mail/send
 *
 * Browser forms (Origin arkastro.be / www / shop):
 *   subject, text and/or html, replyTo?, tag?, website? (honeypot)
 *   Always sends to TO_EMAIL.
 *
 * Server-to-server (header X-Mailer-Key = MAILER_INTERNAL_KEY):
 *   same fields + optional `to` (customer confirmation / notify).
 *
 * Do not set Access-Control-* headers here: App Platform already injects
 * Access-Control-Allow-Origin: *. Adding our own concatenates into an
 * invalid value that browsers reject.
 */

const ALLOWED_ORIGINS = [
  'https://arkastro.be',
  'https://www.arkastro.be',
  'https://shop.arkastro.be',
  'http://localhost:8080',
  'http://localhost:8000',
];

const MAX_SUBJECT = 200;
const MAX_BODY = 20000;
const MAX_TAG = 64;

async function main(event = {}) {
  const http = event.http || {};
  const method = String(http.method || 'GET').toUpperCase();
  const headers = normalizeHeaders(http.headers || {});
  const origin = headers.origin || '';
  const internalKey = process.env.MAILER_INTERNAL_KEY || '';
  const providedKey = headers['x-mailer-key'] || '';
  const isInternal =
    Boolean(internalKey) &&
    providedKey.length > 0 &&
    timingSafeEqual(providedKey, internalKey);

  if (method === 'OPTIONS') {
    return response(204, '');
  }

  if (method === 'GET') {
    return response(200, {
      ok: true,
      service: 'arkastro-mailer',
      time: new Date().toISOString(),
    });
  }

  if (method !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  if (!isInternal && !isAllowedOrigin(origin)) {
    return response(403, { error: 'Forbidden' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return response(500, { error: 'Server misconfigured' });
  }

  const payload = extractPayload(event);

  if (payload.website) {
    return response(200, { ok: true });
  }

  const subject = String(payload.subject || '').trim().slice(0, MAX_SUBJECT);
  const text = String(payload.text || '').trim().slice(0, MAX_BODY);
  const html = String(payload.html || '').trim().slice(0, MAX_BODY);
  const replyTo = String(payload.replyTo || '').trim().slice(0, 320);
  const tag = String(payload.tag || '').trim().slice(0, MAX_TAG);
  const requestedTo = String(payload.to || '').trim().slice(0, 320);

  if (!subject) {
    return response(400, { error: 'subject is required' });
  }

  if (!text && !html) {
    return response(400, { error: 'text or html is required' });
  }

  if (replyTo && !isValidEmail(replyTo)) {
    return response(400, { error: 'Invalid replyTo email' });
  }

  const from = process.env.FROM_EMAIL || 'ArkAstro <noreply@arkastro.be>';
  const defaultTo = process.env.TO_EMAIL || 'info@arkastro.be';

  let to = defaultTo;
  if (isInternal && requestedTo) {
    if (!isValidEmail(requestedTo)) {
      return response(400, { error: 'Invalid to email' });
    }
    to = requestedTo;
  }

  const body = {
    from,
    to: [to],
    subject,
  };

  if (text) body.text = text;
  if (html) body.html = html;
  if (replyTo) body.reply_to = replyTo;
  if (tag) body.tags = [{ name: 'category', value: sanitizeTag(tag) }];

  return sendWithResend(apiKey, body);
}

async function sendWithResend(apiKey, body) {
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'arkastro-mailer/1.0',
      },
      body: JSON.stringify(body),
    });

    const resendBody = await resendRes.json().catch(() => ({}));

    if (!resendRes.ok) {
      console.error('Resend error', resendRes.status, resendBody);
      return response(502, {
        error: 'Send failed. Try again later or mail info@arkastro.be.',
      });
    }

    return response(200, { ok: true, id: resendBody.id || null });
  } catch (err) {
    console.error('Resend request failed', err);
    return response(502, {
      error: 'Send failed. Try again later or mail info@arkastro.be.',
    });
  }
}

function extractPayload(event) {
  if (event && typeof event.body === 'object' && event.body !== null) {
    return event.body;
  }

  if (typeof event.body === 'string') {
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  }

  return {
    subject: event.subject,
    text: event.text,
    html: event.html,
    replyTo: event.replyTo,
    tag: event.tag,
    website: event.website,
    to: event.to,
  };
}

function normalizeHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    out[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function response(statusCode, body) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (statusCode === 204) {
    return { statusCode, headers, body: '' };
  }

  return {
    statusCode,
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeTag(tag) {
  return tag.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, MAX_TAG) || 'mail';
}

module.exports = { main };
