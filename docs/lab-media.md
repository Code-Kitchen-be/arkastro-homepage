# Lab portfolio media (DigitalOcean Spaces)

Lab project photos live on **DigitalOcean Spaces + CDN**, not in git. Site chrome (logos, heroes, icons) stays under [`apps/homepage/assets/`](../apps/homepage/assets/).

The CDN prefix is defined once in [`apps/homepage/src/_data/media.json`](../apps/homepage/src/_data/media.json) as `labSpacesBase`. Portfolio entries in [`labProjects.json`](../apps/homepage/src/_data/labProjects.json) only store **relative** paths under that prefix.

## Space conventions

| Setting | Value |
| --- | --- |
| Space name | `arkastro-bucket` |
| Region | `ams3` |
| Visibility | Public (portfolio images) |
| CDN | Enabled |
| Object key pattern | `homepage/lab/<slug>/…` |
| CDN base (`labSpacesBase`) | `https://arkastro-bucket.ams3.cdn.digitaloceanspaces.com/homepage/lab/` |

Optional later: custom domain `media.arkastro.be` → CNAME to the Spaces CDN endpoint.

Create / manage the Space in the [DigitalOcean Spaces console](https://cloud.digitalocean.com/spaces).

## Optimize before upload

1. Longest edge about **1600–2000px**
2. WebP or JPEG quality ~**75–80**
3. Aim for roughly **&lt; 300 KB** per image

Hosting on Spaces does not replace compression.

## Add a compact project

1. Optimize photo(s) and upload under `homepage/lab/<slug>/` (public).
2. Append an entry to [`labProjects.json`](../apps/homepage/src/_data/labProjects.json):

```json
{
  "slug": "kerstbal",
  "layout": "compact",
  "title": "Kerstbal met custom logo",
  "blurb": "Platte laser-cut kerstbal … Op bestelling via Contact.",
  "price": { "amount": 1, "currency": "EUR", "unit": "stuk" },
  "purchase": true,
  "images": [
    { "src": "kerstbal/front.webp", "alt": "Voorzijde" },
    { "src": "kerstbal/back.webp", "alt": "Achterzijde" }
  ]
}
```

- **`images`**: first = main photo; extra = thumbs (e.g. voor/achter).
- **`price`** + **`purchase: true`**: shows € / stuk and a “Bestel via Contact” button (`?onderwerp=bestelling&product=<slug>`). Shop SKUs use Medusa with **incl. BTW** prices instead.
- Templates resolve URLs as `media.labSpacesBase` + each `images[].src`.

3. Commit and push — CI rebuilds the site.

Omit `layout` or set `"layout": "compact"` for the small card. Use `"layout": "featured"` only for larger showcases.

## Change the CDN host

Edit [`apps/homepage/src/_data/media.json`](../apps/homepage/src/_data/media.json) only. Project entries stay the same as long as object keys under `homepage/lab/` are unchanged.
