# ArkAstro mailer (DigitalOcean Functions + Resend)

General HTTP mailer for forms on [arkastro.be](https://arkastro.be). The site stays on GitHub Pages; this function runs on DigitalOcean App Platform at **mailer.arkastro.be**.

## Endpoint

`POST https://mailer.arkastro.be/mail/send`

JSON body:

| Field | Required | Description |
| --- | --- | --- |
| `subject` | yes | Email subject |
| `text` | one of text/html | Plain text body |
| `html` | one of text/html | HTML body |
| `replyTo` | no | Reply-To address |
| `tag` | no | Resend category tag (e.g. `sponsoraanvraag`) |
| `website` | no | Honeypot — leave empty |

Recipient and sender are **fixed** via env (`TO_EMAIL` / `FROM_EMAIL`). Requests are accepted only from:

- `https://arkastro.be`
- `https://www.arkastro.be`

## Prerequisites

1. [Resend](https://resend.com) account with domain **arkastro.be** verified  
2. API key and a from-address on that domain (e.g. `noreply@arkastro.be`)  
3. DigitalOcean account with App Platform  
4. DNS control for `arkastro.be` (apex/`www` can stay on GitHub Pages)

## Deploy (App Platform)

1. In DigitalOcean → **Apps** → **Create App** → connect this GitHub repo.  
2. Add a **Functions** component with **Source Directory** `mailer`.  
3. Set runtime env vars:

   | Key | Type | Example |
   | --- | --- | --- |
   | `RESEND_API_KEY` | Secret | `re_…` |
   | `FROM_EMAIL` | General | `ArkAstro <noreply@arkastro.be>` |
   | `TO_EMAIL` | General | `info@arkastro.be` |

4. Add custom domain **mailer.arkastro.be** (PRIMARY).  
5. At your DNS provider, create a **CNAME**:

   ```
   mailer.arkastro.be  →  <cname-from-app-platform>.ondigitalocean.app
   ```

   Do not point the apex or `www` at App Platform — those stay on GitHub Pages.

6. Confirm the live path is `https://mailer.arkastro.be/mail/send` (package `mail` / function `send`).

A reference app spec lives at [`.do/app.yaml`](../.do/app.yaml).

## Local deploy (optional)

```bash
cd mailer
cp .env.example .env   # fill RESEND_API_KEY
doctl auth init
doctl serverless install
doctl serverless connect
doctl serverless deploy .
doctl serverless function get mail/send --url
```

Local namespace URLs are for testing only; production uses `mailer.arkastro.be`.

## Site wiring

[`sponsoraanvraag.html`](../sponsoraanvraag.html) posts to this endpoint via `data-api-url`. [`main.js`](../main.js) builds subject/text/html and sends `{ subject, text, html, replyTo, tag, website }`.

Other forms can reuse the same endpoint with their own subject/body.
