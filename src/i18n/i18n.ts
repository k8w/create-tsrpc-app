import { i18nEnUs } from "./en-us";
import { i18nZhCn } from "./zh-cn";

/**
 * Detect system locale from environment variables
 * Priority: LC_ALL > LC_MESSAGES > LANG
 * Returns locale string or empty string if not detected
 */
function getSystemLocale(): string {
    const locale = process.env.LC_ALL
        || process.env.LC_MESSAGES
        || process.env.LANG
        || '';
    return locale.toLowerCase();
}

/**
 * Check if system locale is Chinese
 * Matches: zh_cn, zh-cn, zh_tw, zh-tw, zh.utf-8, etc.
 */
function isChineseLocale(): boolean {
    const locale = getSystemLocale();
    return locale.startsWith('zh_') || locale.startsWith('zh-') || locale.startsWith('zh.');
}

// 根据系统语言判断中英文
export const isZhCN = isChineseLocale();
export const i18n = isZhCN ? i18nZhCn : i18nEnUs;
