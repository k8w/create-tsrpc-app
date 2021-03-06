import osLocale from "os-locale";
import { i18nEnUs } from "./en-us";
import { i18nZhCn } from "./zh-cn";

// 根据系统语言判断中英文
export const i18n = osLocale.sync() === 'zh-CN' ? i18nZhCn : i18nEnUs
// TODO en-us
// export const i18n = i18nEnUs;