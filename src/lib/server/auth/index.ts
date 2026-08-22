import { building } from '$app/environment'
import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'
import { db } from '$lib/server/db'
import { DEFAULT_BRANDING_CONFIG, getBrandingText } from '$lib/entity/Branding'
import { appSettings_store } from '$lib/server/service/appSettings'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { betterAuth } from 'better-auth'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { authEmail_send } from './email'
import { baleAuthPlugin } from './bale'
import { eitaaAuthPlugin } from './eitaa'
import { getLocale, isLocale } from '$lib/paraglide/runtime.js'
import * as m from '$lib/paraglide/messages.js'

const authBaseUrl = env.BETTER_AUTH_URL || env.ORIGIN
const isSecureOrigin = authBaseUrl?.startsWith('https://')

export const auth = betterAuth({
	appName: DEFAULT_BRANDING_CONFIG.texts.fa.name,
	baseURL: authBaseUrl,
	secret: env.BETTER_AUTH_SECRET,
	database: prismaAdapter(db, { provider: 'mysql' }),
	user: {
		additionalFields: {
			locale: {
				type: ['fa', 'ar', 'en'],
				required: true,
				defaultValue: 'fa',
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => ({
					data: { ...user, locale: isLocale(getLocale()) ? getLocale() : 'fa' },
				}),
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		sendResetPassword: async ({ user, url }) => {
			const locale = isLocale(user.locale) ? user.locale : getLocale()
			const branding = getBrandingText(appSettings_store.config.branding, locale)
			await authEmail_send(
				user.email,
				m.auth_reset_email_subject({ name: branding.name }, { locale }),
				m.auth_reset_email_text({ url }, { locale }),
			)
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			const locale = isLocale(user.locale) ? user.locale : getLocale()
			const branding = getBrandingText(appSettings_store.config.branding, locale)
			await authEmail_send(
				user.email,
				m.auth_verify_email_subject({ name: branding.name }, { locale }),
				m.auth_verify_email_text({ url }, { locale }),
			)
		},
	},
	socialProviders:
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
			: {},
	account: {
		accountLinking: { enabled: true },
	},
	advanced: isSecureOrigin
		? {
				useSecureCookies: true,
				defaultCookieAttributes: {
					secure: true,
					sameSite: 'none',
					partitioned: true,
				},
			}
		: undefined,
	plugins: [
		baleAuthPlugin(),
		eitaaAuthPlugin(),
		...(building ? [] : [sveltekitCookies(getRequestEvent)]),
	],
})

export type AuthSession = typeof auth.$Infer.Session
