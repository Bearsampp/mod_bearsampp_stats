# Bearsampp Stats Grid Module

A Joomla 5/6 site module that displays stats for Bearsampp modules. With a single module configured, it renders the dashboard inline on the page. With multiple modules, it shows a configurable grid (3, 4, or 5 columns) of cards — each card opens a Bootstrap 5 modal to display the `stats/dashboard.md` file (folder configurable, default `stats`) from that module's GitHub repository.

## Purpose

This module lets bearsampp.com display per-module stats without relying on GitHub's blob HTML rendering. Instead, it fetches the **raw Markdown** from `raw.githubusercontent.com` and renders it client-side, preserving any graphs, badges, images, or tables embedded in each module's `stats/dashboard.md`.

> Note: `stats/downloads.json` is useful for numeric metrics but does **not** contain the full visual dashboard (badges/graphs/layout). This module intentionally renders `dashboard.md` so you see the same graphs and badges displayed there.

## Features

- **Single module**: renders the dashboard directly on the page (no card, no popup)
- **Multiple modules**: configurable grid (2, 3, 4, or 5 columns) of cards; clicking a card opens a Bootstrap 5 modal
- Uses existing stats/dashboard.md files (no changes required to module repos)
- Client-side Markdown rendering with [Marked.js](https://marked.js.org/) + HTML sanitization with [DOMPurify](https://github.com/cure53/DOMPurify)
- Browser caching (localStorage) with configurable TTL
- Configurable module list and branch
- Accessible (keyboard focusable buttons, ARIA attributes)
- Joomla 5/6 compatible (uses Web Asset Manager)
- Zero 3rd-party Joomla extensions required

## How it works

- Each card corresponds to a module repo under your configured parent path (default `https://github.com/Bearsampp`).
- For a normal Joomla user *(not hosting the `Bearsampp` organisation)*, set the **Parent repository** param to your own GitHub path, e.g.:

  ```text
  https://github.com/YourName
  ```

  The module then fetches:

  ```text
  https://raw.githubusercontent.com/YourName/<module-slug>/<branch>/stats/dashboard.md
  ```

- **Single module**: the dashboard is rendered inline on the page (no modal).  
- **Multiple modules**: clicking a card fetches `stats/dashboard.md` and displays it in a Bootstrap 5 modal.  
- Markdown is parsed and sanitized in the browser, then injected into the page/modal. External links open in a new tab.  
- Results are cached in `localStorage` per `module+branch` to reduce repeated fetches.

### Repo name resolution

Each entry in **Modules list** names a repository under your **Parent repository** path. `module-apache` and `apache` are **the same thing** — both resolve to the `module-apache` repo:

```text
apache         → https://raw.githubusercontent.com/YourName/module-apache/<branch>/gh-dl/dashboard.md
module-apache  → https://raw.githubusercontent.com/YourName/module-apache/<branch>/stats/dashboard.md
```

The default list uses the prefixed form (`module-apache,module-bruno,...`), but plain names work too.

## Installation (Manual)

1. Download or zip this repository's contents as `mod_bearsampp_stats.zip`. The ZIP must contain the module files at the root (`mod_bearsampp_stats.xml`, `mod_bearsampp_stats.php`, `helper.php`, `tmpl/`, `media/`, `language/`) — not nested inside an extra folder.
2. In Joomla 6 Admin → System → Install → Extensions → Upload Package File and upload the ZIP.
3. Go to Content → Site Modules → + New → "Bearsampp Stats Grid", publish to a position, assign to pages, and Save.

## Configuration

| Field | Default | Description |
|---|---|---|
| Modules list | `bearsampp` | Comma/line-separated entries. Spaces after commas are allowed. Each entry is used as the repository name under the parent (e.g. `bearsampp` → `bearsampp`, `module-apache` → `module-apache`). Order = grid order (left-to-right, top-to-bottom). |
| Parent repository | `https://github.com/Bearsampp` | GitHub organisation/user that hosts the module repos. Enter your own path here, e.g. `https://github.com/YourName` (or just `YourName`). |
| Branch | `main` | Git branch to pull `gh-dl/dashboard.md` from. |
  https://raw.githubusercontent.com/YourName/<module-slug>/<branch>/stats/dashboard.md
| Stats folder | stats | Folder inside each module repo that holds dashboard.md and its charts. |
| Grid columns | `5` | Number of modules displayed per row (3, 4, or 5) when multiple modules are configured. Single module renders inline full width. |
| Stats icon (FA code) | `fas fa-chart-bar` | Font Awesome icon classes rendered on each card. Change the FA code to use another icon (e.g. `fa-solid fa-chart-column`), or leave empty for the built-in SVG chart icon. Requires Font Awesome loaded by your template. |

Advanced: Module Class Suffix, Alternate Layout.

## Stats generation (downloads.json + charts + dashboard.md)

This module does **not** generate stats itself. Stats files (`dashboard.md`, `downloads.json`, charts) are generated in each module repository using the [GitHub Downloads Action](https://github.com/justagwas/github-downloads-action) as part of an automated GitHub Actions workflow.

This action is the source of truth for download counts and the SVG charts embedded in `dashboard.md` (including relative paths that this module rewrites to raw URLs). Without it, the stats shown by this module will be missing or stale.

For setup instructions and workflow details, refer to the [`module-apache` stats workflow](https://github.com/Bearsampp/module-apache/blob/main/.github/workflows/stats-daily-with-chart.yml) (or the equivalent workflow in your module repos). The generated output includes SVG trend charts, download counts, and a rendered `dashboard.md` placed in the stats folder (`stats/` by default).

> **Folder consistency**: The module reads <Stats folder>/dashboard.md (default stats). Ensure the workflow writes to the same folder as configured in the module's **Stats folder** parameter.

## Development & Testing

1. Edit files in `E:\Bearsampp-development\mod_bearsampp_stats\`
2. Test locally in a Joomla 6 site. Easiest: copy/symlink the folder to `modules/mod_bearsampp_stats/` in your test site, or zip and reinstall.
3. Test with `php`, `apache`, `xlight` (has `gh-dl/`).
4. Verify badges/images/tables render, modal scrolls, responsive breakpoints, cache (open twice), and 404 fallback ("Stats coming soon").
5. Bump `<version>` in `mod_bearsampp_stats.xml` when preparing a new release.

## Troubleshooting

- **Broken images**: Relative image paths in `dashboard.md` (e.g. `charts/total-trend--black.svg` or `./assets/chart.png`) were previously broken because the browser resolved them against the page origin instead of the raw GitHub URL. The module now automatically rewrites relative `img`/`source`/`a` paths against the raw stats folder (e.g. `charts/total-trend--black.svg` → `https://raw.githubusercontent.com/YourName/<repo>/<branch>/gh-dl/charts/total-trend--black.svg`). Absolute URLs (Shields.io badges, full raw GitHub URLs) still work unchanged. If charts still don't show, check the rewritten URL in the browser devtools — the file must exist in that module repo's stats folder (`gh-dl/`, or whatever the **Stats folder** param is set to).
- **Broken images**: Relative image paths in dashboard.md (e.g. charts/total-trend--black.svg or ./assets/chart.png) were previously broken because the browser resolved them against the page origin instead of the raw GitHub URL. The module now automatically rewrites relative img/source/ paths against the raw stats folder (e.g. charts/total-trend--black.svg → https://raw.githubusercontent.com/YourName/<repo>/<branch>/stats/charts/total-trend--black.svg). Absolute URLs (Shields.io badges, full raw GitHub URLs) still work unchanged. If charts still don't show, check the rewritten URL in the browser devtools — the file must exist in that module repo's stats folder (stats/, or whatever the **Stats folder** param is set to).
- **Mixed branches**: Single global `Branch` param covers all.

## Credits

- Markdown: [Marked.js](https://marked.js.org/)
- Sanitization: [DOMPurify](https://github.com/cure53/DOMPurify)
- Icons: Font Awesome (configurable FA code), inline SVG fallback
- Joomla 6, Bootstrap 5

## License

GNU General Public License version 2 or later, in accordance with the Joomla! licensing rules. See [LICENSE](LICENSE) for details.
