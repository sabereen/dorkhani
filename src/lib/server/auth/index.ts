import { building } from '$app/environment'
import { getRequestEvent } from '$app/server'
import { env } from '$env/dynamic/private'
import { db } from '$lib/server/db'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { betterAuth } from 'better-auth'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { authEmail_send } from './email'
import { eitaaAuthPlugin } from './eitaa'

export const auth = betterAuth({
	appName: 'سامانه ختم جمعی قرآن',
	baseURL: env.BETTER_AUTH_URL || env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: prismaAdapter(db, { provider: 'mysql' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		sendResetPassword: async ({ user, url }) => {
			await authEmail_send(user.email, 'بازیابی رمز عبور', `برای انتخاب رمز تازه این پیوند را باز کنید:\n${url}`)
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await authEmail_send(user.email, 'تأیید نشانی ایمیل', `برای تأیید ایمیل این پیوند را باز کنید:\n${url}`)
		},
	},
	socialProviders:
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
			: {},
	account: {
		accountLinking: { enabled: true },
	},
	plugins: [eitaaAuthPlugin(), ...(building ? [] : [sveltekitCookies(getRequestEvent)])],
})

export type AuthSession = typeof auth.$Infer.Session
