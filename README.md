# Bearsampp Stats Grid Module

A Joomla 5/6 site module that displays live GitHub statistics for any repository. With a single repository configured, it renders a single-article layout directly on the page. With multiple repositories it shows a configurable grid (1–7 columns) of cards; each card opens a Bootstrap 5 modal to display the `dashboard.md` file (folder configurable, default `stats`) from that repository.

## Purpose

This module lets you display per-repository statistics without relying on GitHub's blob HTML rendering. Instead, it fetches the **raw Markdown** from `raw.githubusercontent.com` and renders it client-side, preserving any graphs, badges, images, or tables embedded in each repository's `dashboard.md`.

> Note: `downloads.json` (in the configured stats folder) is useful for numeric metrics but does **not** contain the full visual dashboard (badges/graphs/layout). This module intentionally renders `dashboard.md` so you see the same graphs and badges displayed there.

## Features

- **Single repository**: renders a single-article layout directly on the page (no card, no popup)
- **Multiple repositories**: configurable grid (1–7 columns) of cards; clicking a card opens a Bootstrap 5 modal
- Uses existing `<stats folder>/dashboard.md` files (no changes required to the repositories)
- Client-side Markdown rendering with [Marked.js](https://marked.js.org/) + HTML sanitization with [DOMPurify](https://github.com/cure53/DOMPurify)
- Browser caching (localStorage) with configurable TTL
- Configurable module list and branch
- Accessible (keyboard focusable buttons, ARIA attributes)
- Joomla 5/6 compatible (uses Web Asset Manager)
- Zero 3rd-party Joomla extensions required

## How it works

- Each card corresponds to a repository owned by your configured GitHub owner (default `Bearsampp`).
- If the repositories are forked to another GitHub account, set the **Repository owner** parameter to that owner, e.g.:

  ```text
  https://github.com/YourName
  ```

  The module then fetches:

  ```text
  https://raw.githubusercontent.com/YourName/<repo>/<branch>/stats/dashboard.md
  ```

- **Single repository**: the dashboard is rendered in a single-article layout on the page (no modal).  
- **Multiple repositories**: a grid of cards is shown; clicking a card fetches `dashboard.md` and displays it in a Bootstrap 5 modal. A 1-column grid stacks the cards full width, but they still open the modal on click.  
- Markdown is parsed and sanitized in the browser, then injected into the page/modal. External links open in a new tab.  
- Results are cached in `localStorage` per `module+branch` to reduce repeated fetches.

### Repo name resolution

Each entry in **Modules list** is used **exactly as the repository name** under your configured **Repository owner**. The module does not add or strip a `module-` prefix:

```text
mod_bearsampp_stats → https://raw.githubusercontent.com/Bearsampp/mod_bearsampp_stats/<branch>/<stats-folder>/dashboard.md
```

Use the repository name exactly as it appears on GitHub.

## Installation (Manual)

1. Download or zip this repository's contents as `mod_bearsampp_stats.zip`. The ZIP must contain the module files at the root (`mod_bearsampp_stats.xml`, `mod_bearsampp_stats.php`, `helper.php`, `tmpl/`, `media/`, `language/`) — not nested inside an extra folder.
2. In Joomla 6 Admin → System → Install → Extensions → Upload Package File and upload the ZIP.
3. Go to Content → Site Modules → + New → "Bearsampp Stats Grid", publish to a position, assign to pages, and Save.

## Configuration

| Field | Default | Description |
|---|---|---|
| Modules list | `mod_bearsampp_stats` | Comma/line-separated entries. Spaces after commas are allowed. Each entry is used as the repository name under the configured owner (e.g. `Bearsampp` → `Bearsampp`, `mod_bearsampp_stats` → `mod_bearsampp_stats`). Order = display order (left-to-right, top-to-bottom). |
| Repository owner | `Bearsampp` | GitHub organisation/user that owns the repositories. Enter your own account here, e.g. `https://github.com/YourName` (or just `YourName`). |
| Branch | `main` | Git branch to fetch `<stats folder>/dashboard.md` from. |
| Stats folder | `stats` | Folder inside each repository that holds `dashboard.md` and its charts. |
| Grid columns | `5` | Number of columns for the card grid (1–7) when multiple repositories are configured. A 1-column grid stacks full-width cards that still open the modal. A single configured repository always renders as a single article regardless of this setting. |
| Stats icon (FA code) | `fas fa-chart-bar` | Font Awesome icon classes rendered on each card. Change the FA code to use another icon (e.g. `fa-solid fa-chart-column`), or leave empty for the built-in SVG chart icon. Requires Font Awesome loaded by your template. |

Advanced: Module Class Suffix, Alternate Layout.

## Stats generation (downloads.json + charts + dashboard.md)

This module does **not** generate stats itself. The numeric data and charts (`downloads.json` plus the SVG charts) are produced in each repository by the [GitHub Downloads Action](https://github.com/justagwas/github-downloads-action) as part of an automated GitHub Actions workflow. The action does **not** produce `dashboard.md`; that file is generated and kept in sync by an additional render step in Bearsampp's [`stats-daily-with-chart` workflow](https://github.com/Bearsampp/mod_bearsampp_stats/blob/main/.github/workflows/stats-daily-with-chart.yml), which runs the action.

This action is the source of truth for download counts and the SVG charts embedded in `dashboard.md` (including relative paths that this module rewrites to raw URLs). Without it, the stats shown by this module will be missing or stale.

For setup instructions and workflow details, refer to the [`mod_bearsampp_stats` stats workflow](https://github.com/Bearsampp/mod_bearsampp_stats/blob/main/.github/workflows/stats-daily-with-chart.yml) (or the equivalent workflow in your repositories). The action writes `downloads.json` and the SVG charts into the stats folder (`stats/` in that workflow); the workflow then keeps `dashboard.md` in sync with that data.

> **Dashboard auto-creation (Bearsampp workflow only)**: The action itself does **not** create `dashboard.md`. In Bearsampp's [`stats-daily-with-chart` workflow](https://github.com/Bearsampp/mod_bearsampp_stats/blob/main/.github/workflows/stats-daily-with-chart.yml), an added render step **generates a default one** from `downloads.json` if the file is missing - a title, a one-line description, four Shields.io badges (total / day / week / month), the total-trend chart, all generated charts and the data table. So a repository that uses that workflow gets a working dashboard automatically the first time it runs. If `dashboard.md` already exists, only its `## Data` table is refreshed from the JSON; the rest of your custom content is preserved. A repository that runs the action alone - or any other stats tool - must supply its own `dashboard.md`.

> **Folder consistency**: The module reads <Stats folder>/dashboard.md (default `stats`). Ensure the workflow writes to the same folder as configured in the module's **Stats folder** parameter.

## Development & Testing

1. Edit files in `E:\Bearsampp-development\mod_bearsampp_stats\`
2. Test locally in a Joomla 6 site. Easiest: copy/symlink the folder to `modules/mod_bearsampp_stats/` in your test site, or zip and reinstall.
3. Test with `mod_bearsampp_stats`.
4. Verify badges/images/tables render, modal scrolls, responsive breakpoints, cache (open twice), and 404 fallback ("Stats coming soon").
5. Bump `<version>` in `mod_bearsampp_stats.xml` when preparing a new release.

## Troubleshooting

- **Broken images**: Relative image paths in `dashboard.md` (e.g. `charts/total-trend--black.svg` or `./assets/chart.png`) were previously broken because the browser resolved them against the page origin instead of the raw GitHub URL. The module now automatically rewrites relative `img`/`source`/`a` paths against the raw stats folder (e.g. `charts/total-trend--black.svg` → `https://raw.githubusercontent.com/YourName/<repo>/<branch>/stats/charts/total-trend--black.svg`). Absolute URLs (Shields.io badges, full raw GitHub URLs) still work unchanged. If charts still don't show, check the rewritten URL in the browser devtools — the file must exist in that repository's stats folder (`stats/`, or whatever the **Stats folder** param is set to).
- **Mixed branches**: Single global `Branch` param covers all.

## Credits

- Markdown: [Marked.js](https://marked.js.org/)
- Sanitization: [DOMPurify](https://github.com/cure53/DOMPurify)
- Icons: Font Awesome (configurable FA code), inline SVG fallback
- Joomla 6, Bootstrap 5

## License

GNU General Public License version 3 or later, in accordance with the Joomla! licensing rules. See [LICENSE](LICENSE) for details.
