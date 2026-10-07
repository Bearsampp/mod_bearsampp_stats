<?php

/**
 * @package     Bearsampp.Module.Stats
 * @subpackage  mod_bearsampp_stats
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Bearsampp/mod_bearsampp_stats
 */

defined('_JEXEC') or die;

use Joomla\CMS\Helper\ModuleHelper;

// Load helper
require_once __DIR__ . '/helper.php';

$modules   = ModBearsamppStatsHelper::getModules($params);
$branch    = $params->get('branch', 'main');
$ttl       = (int) $params->get('cache_ttl_minutes', 30);
$showIcons = (int) $params->get('show_icons', 1);
$iconClass = trim((string) $params->get('icon_class', 'fas fa-chart-bar'));

require ModuleHelper::getLayoutPath('mod_bearsampp_stats', $params->get('layout'));
