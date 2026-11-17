# ArkAstro mailer (DigitalOcean Functions + Resend)

HTTP mailer for forms on [arkastro.be](https://arkastro.be) and transactional shop mail from Medusa. Deployed on DigitalOcean App Platform at **mailer.arkastro.be** (see root [`.do/app.yaml`](../.do/app.yaml)).

## Endpoint

### Health check

`GET https://mailer.arkastro.be/mail/send`

```json
{ "ok": true, "service": "arkastro-mailer", "time": "2026-…" }
```

### Send mail (browser forms)

`POST https://mailer.arkastro.be/mail/send`

| Field | Required | Description |
| --- | --- | --- |
| `subject` | yes | Email subject |
| `text` | one of text/html | Plain text body |
| `html` | one of text/html | HTML body |
| `replyTo` | no | Reply-To address |
| `tag` | no | Resend category tag |
| `website` | no | Honeypot — leave empty |

Allowed Origins: `https://arkastro.be`, `https://www.arkastro.be`, `https://shop.arkastro.be` (and localhost in development). Recipient is always `TO_EMAIL`.

### Send mail (server / Medusa)

Same endpoint with header:

`X-Mailer-Key: <MAILER_INTERNAL_KEY>`

When authenticated this way, Origin is not required and optional field `to` sets the recipient (customer confirmation). Forms without the key still cannot set `to`.

## Env vars

| Key | Role |
| --- | --- |
| `RESEND_API_KEY` | Resend API key (secret) |
| `FROM_EMAIL` | e.g. `ArkAstro <noreply@arkastro.be>` |
| `TO_EMAIL` | Default inbox, e.g. `info@arkastro.be` |
| `MAILER_INTERNAL_KEY` | Shared secret for Medusa → mailer |

## Deploy

Part of the multi-component App Platform app. Set `MAILER_INTERNAL_KEY` on both **mailer** and **medusa** components.
