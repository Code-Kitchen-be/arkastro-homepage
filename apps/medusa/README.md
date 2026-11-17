# @arkastro/medusa

Medusa v2 backend for the ArkAstro Custom Lab shop (Belgium, EUR, prices **incl. BTW 21%**, Mollie, Dutch order mail via mailer).

## Local setup

1. Start Postgres + Redis (requires Docker):

   ```bash
   npm run db:up
   ```

2. Copy env:

   ```bash
   cp apps/medusa/.env.template apps/medusa/.env
   ```

3. Migrate and run:

   ```bash
   npm run dev:medusa
   ```

   Admin: http://localhost:9000/app

4. Seed lab products + BE region / shipping:

   ```bash
   npm run seed:lab
   ```

## Mollie

Configure `@variablevic/mollie-payments-medusa` via `MOLLIE_API_KEY`, `MOLLIE_REDIRECT_URL`, `MEDUSA_URL`. Enable the Mollie provider on the België region in Admin. Use test keys until go-live.

## Mailer

Set `MAILER_URL` and `MAILER_INTERNAL_KEY` (same secret as the mailer function). The `order.placed` subscriber sends Dutch confirmation + internal notify.
