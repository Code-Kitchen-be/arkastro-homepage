# arkastro-homepage

Static site for [arkastro.be](https://arkastro.be), built with [Eleventy](https://www.11ty.dev/) + Tailwind CSS and deployed to GitHub Pages.

## Structure

| Path | Role |
| --- | --- |
| [`src/pages/`](src/pages/) | Page content (Nunjucks) |
| [`src/_layouts/base.njk`](src/_layouts/base.njk) | Shared document shell |
| [`src/_includes/`](src/_includes/) | Shared `nav`, `footer`, `head` |
| [`src/styles.css`](src/styles.css) | Tailwind source + brand styles |
| [`main.js`](main.js) | Client JS (forms, bingo downloads) |
| [`src/_data/labProjects.json`](src/_data/labProjects.json) | Custom Lab portfolio entries |
| [`mailer/`](mailer/) | DigitalOcean mailer (separate deploy) |
| [`docs/lab-media.md`](docs/lab-media.md) | Lab photos on DigitalOcean Spaces |

## Development

```bash
npm install
npm run dev
```

That watches Tailwind and serves the site (Eleventy). Open the local URL Eleventy prints (usually `http://localhost:8080`).

One-shot production build:

```bash
npm run build
```

Output goes to `_site/` (gitignored). Do not commit `styles.css` — it is generated.

## Production

Push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml): `npm run build`, then deploy `_site` to GitHub Pages.

Pages source must be **GitHub Actions**. Custom domain is set via [`CNAME`](CNAME) (`arkastro.be`).

## Custom Lab portfolio

Projects are listed in [`src/_data/labProjects.json`](src/_data/labProjects.json):

- **`compact`** (default) — one photo + short title/blurb in a grid  
- **`featured`** — larger story card (e.g. trophies)

Lab photos should be hosted on **DigitalOcean Spaces + CDN**. See [`docs/lab-media.md`](docs/lab-media.md) for the Space name, key layout, optimize → upload → JSON workflow.

## Mailer

Form submissions (contact, sponsoraanvraag) go through [`mailer/`](mailer/). See [`mailer/README.md`](mailer/README.md).
