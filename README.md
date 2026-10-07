# Bearsampp Stats Grid Module (mod_bearsampp_stats)

A Joomla 6 site module that displays a 5×4 (responsive) grid of Bearsampp modules. Each card shows a "stats" icon and the module name. Clicking a card opens a Bootstrap 5 modal popup and renders the `stats/dashboard.md` file from that module's GitHub repository.

## Purpose

This module lets bearsampp.com display per-module stats without relying on GitHub's blob HTML rendering. Instead, it fetches the **raw Markdown** from `raw.githubusercontent.com` and renders it client-side, preserving any graphs, badges, images, or tables embedded in each module's `stats/dashboard.md`.

> Note: `stats/downloads.json` is useful for numeric metrics but does **not** contain the full visual dashboard (badges/graphs/layout). This module intentionally renders `dashboard.md` so you see the same graphs and badges displayed there.

## Features

- 5×4 grid by default, fully responsive (5→4→3→2→1 columns)
- Uses existing `stats/dashboard.md` files (no changes required to module repos)
- Single module with configurable array/list (no need for a module per repo)
- Popup modal on click (no navigation away from page)
- Client-side Markdown rendering with [Marked.js](https://marked.js.org/) + HTML sanitization with [DOMPurify](https://github.com/cure53/DOMPurify)
- Browser caching (localStorage) with configurable TTL
- Configurable module list and branch
- Accessible (keyboard focusable buttons, ARIA attributes)
- Joomla 6 + Bootstrap 5 compatible (uses Web Asset Manager)
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

- On click, it fetches:

- Markdown is parsed and sanitized in the browser, then injected into a Bootstrap 5 modal. External links open in a new tab.
- Results are cached in `localStorage` per `module+branch` to reduce repeated fetches.

## Installation (Manual)

1. Download or zip this repository's contents as `mod_bearsampp_stats.zip`. The ZIP must contain the module files at the root (`mod_bearsampp_stats.xml`, `mod_bearsampp_stats.php`, `helper.php`, `tmpl/`, `media/`, `language/`) — not nested inside an extra folder.
2. In Joomla 6 Admin → System → Install → Extensions → Upload Package File and upload the ZIP.
3. Go to Content → Site Modules → + New → "Bearsampp Stats Grid", publish to a position, assign to pages, and Save.

## Configuration

| Field | Default | Description |
|---|---|---|
| Modules list | `apache,bruno,...,xlight` | Comma/line-separated slugs. Accepts `apache` or `module-apache`. Order = grid order (left-to-right, top-to-bottom). |
| Parent repository | `https://github.com/Bearsampp` | GitHub organisation/user that hosts the module repos. Enter your own path here, e.g. `https://github.com/YourName` (or just `YourName`). |
| Branch | `main` | Git branch to pull `stats/dashboard.md` from. |
| Cache TTL (minutes) | `30` | Client-side localStorage cache per module. `0` disables cache (useful for development). |
| Show stats icon | `Yes` | Toggle the chart icon on cards. |
| Stats icon (FA code) | `fas fa-chart-bar` | Font Awesome icon classes rendered on each card. Change the FA code to use another icon (e.g. `fa-solid fa-chart-column`), or leave empty for the built-in SVG chart icon. Requires Font Awesome loaded by your template. |

Advanced: Module Class Suffix, Alternate Layout.

## Automatic Releases (GitHub Actions)

This repo uses the same release workflow pattern as [`mod_bearsamppai`](https://github.com/Bearsampp/mod_bearsamppai) via `package-packager.yml`. When a PR is merged to `main` (or when manually triggered), the Joomla Extension Packager builds and releases the module.

### Create a release

1. Commit all changes and open a PR to `main`.
2. Merge the PR. The workflow will auto-package and create a release with the installable ZIP.
3. Or trigger manually from Actions → `Package and Release Module` → `Run workflow`.

The workflow generates `mod_bearsampp_stats_<version>.zip` (files at ZIP root) ready for Joomla installation.

## Stats generation (downloads.json + charts + dashboard.md)

To populate `stats/downloads.json`, trend charts, and keep `stats/dashboard.md` preserved, use a scheduled stats workflow per module repo. The recommended reference implementation is [`module-apache`'s `stats-daily-with-chart.yml`](https://github.com/Bearsampp/module-apache/blob/main/.github/workflows/stats-daily-with-chart.yml).

### How it works (reference)

The Apache workflow:

- Runs daily at `03:00 UTC` (`cron: "0 3 * * *"`) and also supports `workflow_dispatch` for manual runs.
- Uses [`justagwas/github-downloads-action@v1`](https://github.com/justagwas/github-downloads-action) to generate:
  - `stats/downloads.json` (release download counts over a 45-day window)
  - SVG charts: `stats/downloads-trend.svg` and individual charts under `stats/charts/` (total-trend, daily, weekly, monthly, black theme)
- Writes generated files to an unprotected staging branch (`gh-dl-data`) first (to avoid protected `main` push issues), then creates a Pull Request from `update-stats` to `main` with collected totals (total/day/week/month).
- **Preserves** any custom `stats/dashboard.md` (and `stats/dashboard.html` if present) across runs. It copies existing dashboard files before replacing `stats/` with generated artifacts, rewrites any `gh-dl` references to `stats`, and removes the legacy `gh-dl-daily-with-chart.yml` if present.
- Auto-attempts to approve and auto-merge the PR (uses `GH_PAT`/`BEARSAMPP_BOT_PAT` as configured). If checks aren't ready or permissions differ, it falls back gracefully.

### How to implement in a module repo

1. **Create the workflow file** in the target repo: `.github/workflows/stats-daily-with-chart.yml` (copy the Apache version as-is is the easiest starting point).
2. **Ensure `stats/` exists** with at least `stats/dashboard.md` (your dashboard content). The module reads this file; the action will preserve/update it on every run.
3. **Required GitHub secrets** (set in repo Settings → Secrets and variables → Actions):
   - `GH_PAT` — Personal Access Token with repo/write permissions used by `create-pull-request`, auto-merge, and checkout with token (as used in the workflow).
   - `BEARSAMPP_BOT_PAT` — Bot PAT used to approve the PR (`gh pr review --approve`). If you don't use a bot, you can adjust the approval step to use `GH_PAT` instead, but the reference uses both.
4. **Branch protection considerations**: `main` is protected in Bearsampp repos. The workflow handles this by writing to `gh-dl-data` staging branch and promoting via PR — do not change this pattern unless your protection rules differ.

### Running the action for the first time

1. Go to the repo → **Actions** → **stats-daily-with-chart** → **Run workflow** (top-right).
2. Leave inputs as default (no inputs required) and click **Run workflow**. This triggers `workflow_dispatch`.
3. The job `publish-downloads` runs first:
   - Checks out the repo
   - Runs `justagwas/github-downloads-action@v1` to generate `downloads.json`, charts, and trend SVG into `stats/` on the `gh-dl-data` branch
   - Checks if anything changed (`published`/`chart_published`). If no change, it stops early.
4. If changed, `create-update-pr`:
   - Downloads artifacts, preserves `stats/dashboard.md`/`dashboard.html`, cleans up legacy files, and opens PR `update-stats` → `main` with totals in the description
   - Attempts approval (bot PAT) and enables auto-merge; may wait/retry and fall back to direct merge if appropriate
5. Once merged, `main` contains updated `stats/downloads.json`, charts, and your preserved `stats/dashboard.md`. The module (reading `dashboard.md` via raw.githubusercontent.com) will reflect updates after the merge reaches `main`/your configured branch.

### Important notes & tips

- **Preserve your dashboard**: Never edit generated JSON/charts by hand in `main` expecting them to stick — the action regenerates them. Put all custom content in `stats/dashboard.md` (and optionally `dashboard.html`). The workflow explicitly preserves these files.
- **Path consistency**: The workflow normalizes references from `gh-dl` to `stats` inside `dashboard.md` during the PR step. If your custom dashboard references `gh-dl/` paths, they'll be adjusted automatically.
- **First run may create branches**: Expect `gh-dl-data` and `update-stats` branches to appear on first successful run. These are normal and can be left (future runs overwrite/update `update-stats` and refresh `gh-dl-data`).
- **No material changes**: Some days there may be no new downloads — the action detects this and skips creating a PR entirely (`changed=false`).
- **Secrets required**: If you see PR creation/approval/merge failures on first run, verify `GH_PAT` and `BEARSAMPP_BOT_PAT` have sufficient repo permissions (contents: write, pull-requests: write) and that branch protection allows the bot to merge.
- **Manual testing**: Use `workflow_dispatch` anytime to force a snapshot refresh (helpful after publishing a new release).
- **Cron schedule**: `0 3 * * *` (3 AM UTC) is fine for Bearsampp repos; adjust only if you have different reporting needs.

## Development & Testing

1. Edit files in `E:\Bearsampp-development\mod_bearsampp_stats\`
2. Test locally in a Joomla 6 site. Easiest: copy/symlink the folder to `modules/mod_bearsampp_stats/` in your test site, or zip and reinstall.
3. Test with `php`, `apache`, `xlight` (has `stats/`).
4. Verify badges/images/tables render, modal scrolls, responsive breakpoints, cache (open twice), and 404 fallback ("Stats coming soon").
5. Bump `<version>` in `mod_bearsampp_stats.xml` when preparing a new release.

## Troubleshooting

- **Broken images**: If `dashboard.md` uses relative image paths (e.g. `./assets/chart.png`), those resolve relative to the page origin, not the raw GitHub path. Prefer absolute image URLs (`https://raw.githubusercontent.com/Bearsampp/module-.../<branch>/stats/assets/...`) or Shields.io absolute badge URLs.
- **CORS**: `raw.githubusercontent.com` is CORS-accessible for GET in standard browser contexts.
- **Mixed branches**: Single global `Branch` param covers all.

## Credits

- Markdown: [Marked.js](https://marked.js.org/)
- Sanitization: [DOMPurify](https://github.com/cure53/DOMPurify)
- Icons: Font Awesome (configurable FA code), inline SVG fallback
- Joomla 6, Bootstrap 5

## License

GNU General Public License version 2 or later, in accordance with the Joomla! licensing rules. See [LICENSE](LICENSE) for details.
