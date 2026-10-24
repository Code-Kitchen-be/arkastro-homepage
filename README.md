# arkastro-homepage

Static site for [arkastro.be](https://arkastro.be), deployed to GitHub Pages.

## Development

```bash
npm install
npm run watch:css
```

`watch:css` rebuilds `styles.css` from [`src/styles.css`](src/styles.css) whenever HTML or source CSS changes. Serve the repo root with any static file server (for example `npx serve .`) and open the HTML files in a browser.

One-shot build (same as CI):

```bash
npm run build:css
```

Do not commit `styles.css` — it is generated and gitignored.

## Production

Push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml): install deps, build Tailwind CSS, deploy the site to GitHub Pages.

**One-time:** in the GitHub repo → Settings → Pages → Source → **GitHub Actions** (not “Deploy from a branch”).

Custom domain is set via [`CNAME`](CNAME) (`arkastro.be`).

## Mailer

Form submissions go through the DigitalOcean function under [`mailer/`](mailer/). See [`mailer/README.md`](mailer/README.md).
