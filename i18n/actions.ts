'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { COOKIE_NAME_LOCALE, isLocale, type Locale } from './config';

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function setUserLocale(locale: Locale) {
    if (!isLocale(locale)) {
        return;
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME_LOCALE, locale, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
    });

    revalidatePath('/', 'layout');
}