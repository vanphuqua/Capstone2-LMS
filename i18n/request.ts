// src/i18n/request.ts
import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { COOKIE_NAME_LOCALE, defaultLocale, isLocale } from './config';

const namespaces = ['common', 'course', 'auth', 'dashboard', 'teacher', 'settings', 'admin'] as const;

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get(COOKIE_NAME_LOCALE)?.value;

    const locale = isLocale(savedLocale) ? savedLocale : defaultLocale;

    const messages = Object.fromEntries(
        await Promise.all(
            namespaces.map(async (namespace) => {
                const messages = (await import(`../locales/${locale}/${namespace}.json`)).default;

                return [namespace, messages];
            }),
        ),
    );

    return {
        locale,
        messages,
    };
});