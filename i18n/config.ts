export const locales = ['vi', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

export const COOKIE_NAME_LOCALE = 'locale';

export function isLocale(value: unknown): value is Locale {
    return locales.includes(value as Locale);
}