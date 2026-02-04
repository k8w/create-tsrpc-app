import { execSync } from "child_process";
import { osLocale } from "os-locale-s";
import { i18nEnUs } from "./en-us";
import { i18nZhCn } from "./zh-cn";

/**
 * Check if a locale string indicates Chinese
 * Matches: zh_cn, zh-cn, zh_tw, zh-tw, zh-hans, zh-hant, etc.
 */
function matchesChinese(locale: string): boolean {
    return /^zh[-_.]/.test(locale) || /^zh$/.test(locale);
}

/**
 * On macOS, LANG env var is often auto-set (e.g. en_AU.UTF-8)
 * and doesn't reflect the actual system language preference.
 * Use `defaults read -g AppleLocale` as fallback.
 */
function getMacOSLocale(): string {
    if (process.platform !== 'darwin') return '';
    try {
        return execSync('defaults read -g AppleLocale', {
            encoding: 'utf-8',
            timeout: 3000,
        }).trim().toLowerCase();
    } catch {
        return '';
    }
}

/**
 * Detect if system locale is Chinese
 * 1. Use os-locale-s for cross-platform detection (env vars / wmic / defaults)
 * 2. Fallback to macOS AppleLocale when env vars don't reflect actual preference
 */
function isChineseLocale(): boolean {
    // os-locale-s: handles Windows (wmic), Linux/macOS (env vars) uniformly
    const locale = osLocale.sync().toLowerCase();
    if (matchesChinese(locale)) return true;

    // macOS fallback: LANG often doesn't match system language
    const macLocale = getMacOSLocale();
    if (macLocale && matchesChinese(macLocale)) return true;

    return false;
}

// 根据系统语言判断中英文
export const isZhCN = isChineseLocale();
export const i18n = isZhCN ? i18nZhCn : i18nEnUs;
