/**
 * General mailer for arkastro.be — DigitalOcean Functions + Resend.
 *
 * POST https://mailer.arkastro.be/mail/send
 * Accepts: subject, text and/or html, replyTo?, tag?, website? (honeypot)
 * Sends only to TO_EMAIL (fixed). Origin must be arkastro.be / www.
 */

const ALLOWED_ORIGINS = [
  'https://arkastro.be',
  'https://www.arkastro.be',
];

const MAX_SUBJECT = 200;
const MAX_BODY = 20000;
const MAX_TAG = 64;

async function main(event = {}) {
  const http = event.http || {};
  const method = String(http.method || 'GET').toUpperCase();
  const headers = normalizeHeaders(http.headers || {});
  const origin = headers.origin || '';

  const cors = corsHeaders(origin);

  if (method === 'OPTIONS') {
    return response(204, '', cors);
  }

  if (method !== 'POST') {
    return response(405, { error: 'Method not allowed' }, cors);
  }

  if (!isAllowedOrigin(origin)) {
    return response(403, { error: 'Forbidden' }, cors);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return response(500, { error: 'Server misconfigured' }, cors);
  }

  const payload = extractPayload(event);

  // Honeypot — bots fill this; humans leave it empty
  if (payload.website) {
    return response(200, { ok: true }, cors);
  }

  const subject = String(payload.subject || '').trim().slice(0, MAX_SUBJECT);
  const text = String(payload.text || '').trim().slice(0, MAX_BODY);
  const html = String(payload.html || '').trim().slice(0, MAX_BODY);
  const replyTo = String(payload.replyTo || '').trim().slice(0, 320);
  const tag = String(payload.tag || '').trim().slice(0, MAX_TAG);

  if (!subject) {
    return response(400, { error: 'subject is required' }, cors);
  }

  if (!text && !html) {
    return response(400, { error: 'text or html is required' }, cors);
  }

  if (replyTo && !isValidEmail(replyTo)) {
    return response(400, { error: 'Invalid replyTo email' }, cors);
  }

  const from = process.env.FROM_EMAIL || 'ArkAstro <noreply@arkastro.be>';
  const to = process.env.TO_EMAIL || 'info@arkastro.be';

  const body = {
    from,
    to: [to],
    subject,
  };

  if (text) body.text = text;
  if (html) body.html = html;
  if (replyTo) body.reply_to = replyTo;
  if (tag) body.tags = [{ name: 'category', value: sanitizeTag(tag) }];

  return sendWithResend(apiKey, body, cors);
}

async function sendWithResend(apiKey, body, cors) {
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
      return response(
        502,
        { error: 'Send failed. Try again later or mail info@arkastro.be.' },
        cors
      );
    }

    return response(200, { ok: true, id: resendBody.id || null }, cors);
  } catch (err) {
    console.error('Resend request failed', err);
    return response(
      502,
      { error: 'Send failed. Try again later or mail info@arkastro.be.' },
      cors
    );
  }
}

function extractPayload(event) {
  // DO web functions flatten JSON body onto event; also support nested body.
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

function corsHeaders(origin) {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function response(statusCode, body, cors) {
  const headers = {
    ...cors,
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
