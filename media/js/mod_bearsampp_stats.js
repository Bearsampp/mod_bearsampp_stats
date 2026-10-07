/**
 * Bearsampp Stats Module
 * Fetches stats/dashboard.md from raw.githubusercontent.com and renders in Bootstrap 5 modal
 */

const markedUrl = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
const dompurifyUrl = 'https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js';

async function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.head.appendChild(s);
    });
}

function getCacheKey(slug, branch) {
    return `bearsampp_stats_${slug}_${branch}`;
}

function readCache(key, ttlMinutes) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const item = JSON.parse(raw);
        if (!item || !item.ts || !item.md) return null;
        const ageMin = (Date.now() - item.ts) / 60000;
        if (ttlMinutes > 0 && ageMin > ttlMinutes) {
            localStorage.removeItem(key);
            return null;
        }
        return item.md;
    } catch (e) {
        return null;
    }
}

function writeCache(key, md) {
    try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), md }));
    } catch (e) {
        // Ignore quota errors
    }
}

function ensureMarkdownLibs() {
    return Promise.all([
        loadScript(markedUrl).catch(() => null),
        loadScript(dompurifyUrl).catch(() => null),
    ]);
}

function parseMarkdown(md) {
    if (window.marked && typeof window.marked.parse === 'function') {
        let html = window.marked.parse(md);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
            html = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        }
        return html;
    }
    // Fallback: escape
    const div = document.createElement('div');
    div.textContent = md;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    const opts = Joomla.getOptions ? Joomla.getOptions('mod_bearsampp_stats') : (window.mod_bearsampp_stats || {});
    const i18n = opts.i18n || {};
    const ttlDefault = typeof opts.ttl === 'number' ? opts.ttl : 30;
    const branchDefault = opts.branch || 'main';

    let libsReady = ensureMarkdownLibs();

    document.querySelectorAll('.bearsampp-stats-card').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const moduleBase = btn.dataset.module;
            const slug = btn.dataset.slug || ('module-' + moduleBase);
            const display = btn.dataset.display || moduleBase;
            const rawUrl = btn.dataset.rawurl;

            // Find modal for this module instance
            const modalEl = btn.closest('.mod-bearsampp-stats')?.nextElementSibling;
            if (!modalEl || !modalEl.classList.contains('bearsampp-stats-modal')) return;

            const modal = new bootstrap.Modal(modalEl);
            const titleEl = modalEl.querySelector('.modal-title');
            const loadingEl = modalEl.querySelector('.bearsampp-stats-loading');
            const contentEl = modalEl.querySelector('.bearsampp-stats-content');
            const errorEl = modalEl.querySelector('.bearsampp-stats-error');

            // Reset state
            if (titleEl) titleEl.textContent = i18n.statsFor ? (i18n.statsFor + ' ' + display) : ('Stats: ' + display);
            if (loadingEl) loadingEl.classList.remove('d-none');
            if (contentEl) {
                contentEl.innerHTML = '';
                contentEl.classList.add('d-none');
            }
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.add('d-none');
            }

            modal.show();

            const cacheKey = getCacheKey(moduleBase || slug.replace('module-', ''), branchDefault);
            const ttlM = ttlDefault;

            try {
                await libsReady;

                let md = readCache(cacheKey, ttlM);
                if (md === null) {
                    const res = await fetch(rawUrl, { cache: 'default' });
                    if (res.status === 404) {
                        throw new Error('NOT_FOUND');
                    }
                    if (!res.ok) {
                        throw new Error('HTTP_' + res.status);
                    }
                    md = await res.text();
                    writeCache(cacheKey, md);
                }

                // Render markdown
                const html = parseMarkdown(md || '');

                if (loadingEl) loadingEl.classList.add('d-none');
                if (contentEl) {
                    contentEl.innerHTML = html;
                    contentEl.classList.remove('d-none');
                }

                // Rewrite relative image/link paths against the raw GitHub folder so
                // graphs, badges and charts (e.g. stats/charts/total-trend--black.svg
                // referenced as "charts/total-trend--black.svg") resolve to
                // raw.githubusercontent.com instead of the page origin.
                const baseUrl = rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1);
                const isAbsoluteUrl = (u) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
                contentEl?.querySelectorAll('img[src], a[href], source[src]').forEach((el) => {
                    const attr = el.tagName === 'A' ? 'href' : 'src';
                    const val = el.getAttribute(attr);
                    if (val && !isAbsoluteUrl(val)) {
                        try {
                            el.setAttribute(attr, new URL(val, baseUrl).href);
                        } catch (e) {
                            // Keep the original value if it cannot be resolved.
                        }
                    }
                });

                // Make relative links/images work if any appear (GitHub raw images usually absolute)
                // Optional: open external links in new tab
                contentEl?.querySelectorAll('a[href^="http"]').forEach((a) => {
                    if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
                    if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
                });

            } catch (err) {
                let msg = i18n.errorFetch || 'Failed to load stats.';
                if (err && err.message === 'NOT_FOUND') {
                    msg = i18n.noStats || 'Stats coming soon for this module.';
                }
                if (loadingEl) loadingEl.classList.add('d-none');
                if (errorEl) {
                    errorEl.textContent = msg;
                    errorEl.classList.remove('d-none');
                }
            }
        });
    });
});
