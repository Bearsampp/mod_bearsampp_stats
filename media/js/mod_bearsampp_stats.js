/**
 * @package     Bearsampp.Module.Stats
 * @subpackage  mod_bearsampp_stats
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Bearsampp/mod_bearsampp_stats
 */

document.addEventListener('DOMContentLoaded', () => {
    const options = Joomla.getOptions ? Joomla.getOptions('mod_bearsampp_stats') : {};
    const i18n = options.i18n || {};
    const ttl = (options.ttl !== undefined) ? parseInt(options.ttl, 10) : 30;
    const gridCols = options.gridCols || 5;

    const modals = [];
    const modalEl = document.querySelector('.bearsampp-stats-modal');
    let bsModal;

    if (modalEl && typeof bootstrap !== 'undefined') {
        bsModal = new bootstrap.Modal(modalEl);
        modals.push(bsModal);
    }

    // Helper: cache
    const getCache = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (ttl > 0 && data.expires < Date.now()) {
                localStorage.removeItem(key);
                return null;
            }
            return data.content;
        } catch (e) {
            return null;
        }
    };

    const setCache = (key, content) => {
        if (ttl <= 0) return;
        try {
            localStorage.setItem(key, JSON.stringify({
                content: content,
                expires: Date.now() + ttl * 60 * 1000
            }));
        } catch (e) {
            // ignore
        }
    };

    const fetchAndRender = async (rawUrl, module, slug, branch, contentEl, loadingEl, errorEl, isModal = false) => {
        const baseUrl = rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1);
        const cacheKey = `bearsampp-stats:${module}:${slug}:${branch}`;
        let htmlContent = getCache(cacheKey);

        if (htmlContent) {
            renderContent(htmlContent, contentEl, baseUrl);
            if (loadingEl) loadingEl.classList.add('d-none');
            if (contentEl) contentEl.classList.remove('d-none');
            if (errorEl) errorEl.classList.add('d-none');
            return;
        }

        try {
            if (loadingEl) loadingEl.classList.remove('d-none');
            if (contentEl) contentEl.classList.add('d-none');
            if (errorEl) errorEl.classList.add('d-none');

            const response = await fetch(rawUrl, { cache: 'no-cache' });
            if (!response.ok) throw new Error('HTTP ' + response.status);

            const markdown = await response.text();
            if (!window.marked || typeof window.marked.parse !== 'function') {
                throw new Error('Markdown renderer is unavailable.');
            }
            if (!window.DOMPurify || typeof window.DOMPurify.sanitize !== 'function') {
                throw new Error('HTML sanitizer is unavailable.');
            }
            const html = window.DOMPurify.sanitize(window.marked.parse(markdown));

            setCache(cacheKey, html);
            renderContent(html, contentEl, baseUrl);

            if (loadingEl) loadingEl.classList.add('d-none');
            if (contentEl) contentEl.classList.remove('d-none');
            if (errorEl) errorEl.classList.add('d-none');
        } catch (err) {
            console.error('Bearsampp Stats fetch error:', err);
            if (loadingEl) loadingEl.classList.add('d-none');
            if (contentEl) contentEl.classList.add('d-none');
            if (errorEl) {
                errorEl.textContent = i18n.errorFetch || 'Failed to load stats.';
                errorEl.classList.remove('d-none');
            }
            if (isModal && bsModal) bsModal.hide();
        }
    };

    const renderContent = (html, contentEl, baseUrl) => {
        if (!contentEl) return;
        contentEl.innerHTML = html;
        const isAbsoluteUrl = (u) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
        contentEl.querySelectorAll('img[src], a[href], source[src]').forEach((el) => {
            const attr = el.tagName === 'A' ? 'href' : 'src';
            const val = el.getAttribute(attr);
            if (val && !isAbsoluteUrl(val)) {
                try {
                    el.setAttribute(attr, new URL(val, baseUrl).href);
                } catch (e) {
                }
            }
        });
        contentEl.querySelectorAll('a[href^="http"]').forEach((a) => {
            if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
            if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
        });
    };

    // Grid buttons
    document.querySelectorAll('.bearsampp-stats-card').forEach((card) => {
        card.addEventListener('click', () => {
            const module = card.dataset.module;
            const slug = card.dataset.slug;
            const display = card.dataset.display;
            const rawUrl = card.dataset.rawurl;
            const modalTitle = document.querySelector('.bearsampp-stats-modal .modal-title');
            if (modalTitle) modalTitle.textContent = (i18n.statsFor || 'Stats:') + ' ' + (display || module);
            const contentEl = document.querySelector('.bearsampp-stats-modal .bearsampp-stats-content');
            const loadingEl = document.querySelector('.bearsampp-stats-modal .bearsampp-stats-loading');
            const errorEl = document.querySelector('.bearsampp-stats-modal .bearsampp-stats-error');
            if (rawUrl) {
                fetchAndRender(rawUrl, module, slug, options.branch || 'main', contentEl, loadingEl, errorEl, true);
            }
            if (bsModal) bsModal.show();
        });
    });

    // Inline single module
    const inline = document.querySelector('.bearsampp-stats-inline');
    if (inline) {
        const module = inline.dataset.module;
        const slug = inline.dataset.slug;
        const rawUrl = inline.dataset.rawurl;
        const contentEl = inline.querySelector('.bearsampp-stats-content');
        const loadingEl = inline.querySelector('.bearsampp-stats-loading');
        const errorEl = inline.querySelector('.bearsampp-stats-error');
        if (rawUrl) {
            fetchAndRender(rawUrl, module, slug, options.branch || 'main', contentEl, loadingEl, errorEl, false);
        }
    }
});
