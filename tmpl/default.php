<?php

/**
 * @package     Bearsampp.Module.Stats
 * @subpackage  mod_bearsampp_stats
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Bearsampp/mod_bearsampp_stats
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

// Load Web Assets
$wa = Factory::getApplication()->getDocument()->getWebAssetManager();
$wa->registerAndUseStyle('mod_bearsampp_stats.style', 'mod_bearsampp_stats/style.css');
$wa->registerAndUseScript('mod_bearsampp_stats.script', 'mod_bearsampp_stats/mod_bearsampp_stats.js', [], ['type' => 'module'], ['core']);

// Pass data to JS
$doc = Factory::getDocument();
$doc->addScriptOptions('mod_bearsampp_stats', [
    'branch'   => $branch,
    'ttl'      => $ttl,
    'i18n'     => [
        'loading'        => Text::_('MOD_BEARSAMPP_STATS_LOADING'),
        'errorFetch'     => Text::_('MOD_BEARSAMPP_STATS_ERROR_FETCH'),
        'noStats'        => Text::_('MOD_BEARSAMPP_STATS_NO_STATS'),
        'statsFor'       => Text::_('MOD_BEARSAMPP_STATS_STATS_FOR'),
        'close'          => Text::_('MOD_BEARSAMPP_STATS_CLOSE'),
    ],
]);

$modalId = 'bearsampp-stats-modal-' . $module->id;
?>

<div class="mod-bearsampp-stats <?php echo htmlspecialchars($params->get('moduleclass_sfx', '')); ?>">
    <div class="bearsampp-stats-grid">
        <?php foreach ($modules as $m): ?>
            <button
                type="button"
                class="bearsampp-stats-card"
                data-module="<?php echo htmlspecialchars($m['nameBase']); ?>"
                data-slug="<?php echo htmlspecialchars($m['slug']); ?>"
                data-display="<?php echo htmlspecialchars($m['display']); ?>"
                data-rawurl="<?php echo htmlspecialchars($m['rawUrl']); ?>"
                aria-haspopup="dialog"
                aria-controls="<?php echo $modalId; ?>"
            >
                <?php if ($showIcons): ?>
                    <span class="bearsampp-stats-icon" aria-hidden="true">
                        <?php if ($iconClass !== ''): ?>
                            <i class="<?php echo htmlspecialchars($iconClass); ?>"></i>
                        <?php else: ?>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column">
                                <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
                                <path d="M18 17V9"/>
                                <path d="M13 17V5"/>
                                <path d="M8 17v-3"/>
                            </svg>
                        <?php endif; ?>
                    </span>
                <?php endif; ?>
                <span class="bearsampp-stats-name"><?php echo htmlspecialchars($m['display']); ?></span>
            </button>
        <?php endforeach; ?>
    </div>
</div>

<!-- Bootstrap 5 Modal -->
<div class="modal fade bearsampp-stats-modal" id="<?php echo $modalId; ?>" tabindex="-1" aria-hidden="true" aria-labelledby="<?php echo $modalId; ?>-label">
    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="<?php echo $modalId; ?>-label">Stats</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="<?php echo Text::_('MOD_BEARSAMPP_STATS_CLOSE'); ?>"></button>
            </div>
            <div class="modal-body bearsampp-stats-modal-body">
                <div class="bearsampp-stats-loading text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden"><?php echo Text::_('MOD_BEARSAMPP_STATS_LOADING'); ?></span>
                    </div>
                    <p class="mt-2 mb-0"><?php echo Text::_('MOD_BEARSAMPP_STATS_LOADING'); ?></p>
                </div>
                <div class="bearsampp-stats-content d-none"></div>
                <div class="bearsampp-stats-error d-none alert alert-warning mt-0" role="alert"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><?php echo Text::_('MOD_BEARSAMPP_STATS_CLOSE'); ?></button>
            </div>
        </div>
    </div>
</div>
