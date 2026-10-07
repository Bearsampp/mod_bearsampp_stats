<?php

/**
 * @package     Bearsampp.Module.Stats
 * @subpackage  mod_bearsampp_stats
 * @license     GNU General Public License version 2 or later
 * @link        https://github.com/Bearsampp/mod_bearsampp_stats
 */

defined('_JEXEC') or die;

class ModBearsamppStatsHelper
{
    /**
     * Get list of modules to display
     *
     * @param   \Joomla\Registry\Registry  $params
     *
     * @return  array
     */
    public static function getModules($params)
    {
        $listRaw = trim((string) $params->get('modules_list', ''));
        $branch  = trim((string) $params->get('branch', 'main'));
        $ttl     = (int) $params->get('cache_ttl_minutes', 30);
        $owner   = self::getOwner($params);

        if ($listRaw === '') {
            return [];
        }

        // Split by comma, newline, semicolon, space
        $items = preg_split('/[\r\n,;\s]+/', $listRaw);
        $items = array_filter(array_map('trim', $items));
        $items = array_values(array_unique($items));

        $result = [];

        foreach ($items as $slug) {
            // Normalize slug: allow "module-apache" or "apache"
            if (strpos($slug, 'module-') !== 0) {
                $slugNorm = 'module-' . $slug;
            } else {
                $slugNorm = $slug;
            }

            // Display name: remove "module-" and title-case
            $nameBase = str_replace('module-', '', $slugNorm);
            $display  = ucwords(str_replace(['-', '_'], ' ', $nameBase));

            // Raw dashboard.md URL (raw.githubusercontent.com)
            $rawUrl = sprintf(
                'https://raw.githubusercontent.com/%s/%s/%s/stats/dashboard.md',
                rawurlencode($owner),
                rawurlencode($slugNorm),
                $branch
            );

            // Fallback display name mapping (keeps common names nice)
            $map = [
                'apache'       => 'Apache',
                'bruno'        => 'Bruno',
                'composer'     => 'Composer',
                'ghostscript'  => 'Ghostscript',
                'git'          => 'Git',
                'mailpit'      => 'Mailpit',
                'mariadb'      => 'MariaDB',
                'memcached'    => 'Memcached',
                'mysql'        => 'MySQL',
                'ngrok'        => 'ngrok',
                'nodejs'       => 'Node.js',
                'perl'         => 'Perl',
                'php'          => 'PHP',
                'phpmyadmin'   => 'phpMyAdmin',
                'phppgadmin'   => 'phpPgAdmin',
                'postgresql'   => 'PostgreSQL',
                'powershell'   => 'PowerShell',
                'python'       => 'Python',
                'ruby'         => 'Ruby',
                'xlight'       => 'Xlight',
            ];

            if (isset($map[$nameBase])) {
                $display = $map[$nameBase];
            }

            $result[] = [
                'slug'      => $slugNorm,
                'nameBase'  => $nameBase,
                'display'   => $display,
                'rawUrl'    => $rawUrl,
                'branch'    => $branch,
                'ttl'       => $ttl,
            ];
        }

        return $result;
    }

    /**
     * Resolve the GitHub organisation/user (parent path) that hosts the module repos.
     * Accepts "https://github.com/Bearsampp", "github.com/Bearsampp", "Bearsampp" or
     * "Bearsampp/module-apache" (only the first path segment is used).
     *
     * @param   \Joomla\Registry\Registry  $params
     *
     * @return  string
     */
    public static function getOwner($params)
    {
        $parent = trim((string) $params->get('parent_repo', 'https://github.com/Bearsampp'));

        if ($parent === '') {
            $parent = 'https://github.com/Bearsampp';
        }

        $parent = preg_replace('#^https?://#i', '', $parent);
        $parent = preg_replace('#^www\.#i', '', $parent);
        $parent = preg_replace('#^github\.com/#i', '', $parent);

        $segments = array_values(array_filter(explode('/', trim($parent, '/')), 'strlen'));
        $owner    = $segments[0] ?? '';

        return $owner !== '' ? $owner : 'Bearsampp';
    }
}
