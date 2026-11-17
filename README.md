# ArkAstro monorepo

Homepage ([arkastro.be](https://arkastro.be)), lab webshop, Medusa backend, and mailer — one repo for DigitalOcean App Platform.

## Structure

| Path | Role |
| --- | --- |
| [`apps/homepage/`](apps/homepage/) | Static marketing site (Eleventy + Tailwind) |
| [`apps/shop/`](apps/shop/) | Lab storefront (Next.js + Medusa) |
| [`apps/medusa/`](apps/medusa/) | Medusa v2 API + Admin |
| [`packages/brand/`](packages/brand/) | Shared brand tokens (marine/gold, Montserrat) |
| [`mailer/`](mailer/) | DigitalOcean Functions mailer (Resend) |
| [`docs/lab-media.md`](docs/lab-media.md) | Lab photos on DigitalOcean Spaces |
| [`.do/app.yaml`](.do/app.yaml) | App Platform multi-component spec |

**Runtime:** Node.js **26+** everywhere.

## Development

```bash
npm install
npm run dev:homepage   # http://localhost:8080
npm run dev:medusa     # API + Admin (needs Postgres/Redis)
npm run dev:shop       # http://localhost:8000
```

Homepage build output: `apps/homepage/_site/` (gitignored). Do not commit generated `styles.css`.

## Domains (target)

| Host | Component |
| --- | --- |
| `arkastro.be` | Homepage static |
| `shop.arkastro.be` | Lab shop |
| `api.arkastro.be` | Medusa API + Admin |
| `mailer.arkastro.be` | Mailer function |

## Shop policy

- Catalog: Custom Lab only
- Market: Belgium, EUR, Dutch UI
- Prices: **inclusief BTW 21%**
- Payments: Mollie
- Email: via `mailer/`

## Homepage (GitHub Pages, interim)

Until App Platform cutover, push to `main` still deploys the homepage via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Mailer

See [`mailer/README.md`](mailer/README.md).
