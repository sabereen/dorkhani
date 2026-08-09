import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '$env/dynamic/private'
import { APIError, createAuthEndpoint, getSessionFromCtx } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import type { BetterAuthPlugin } from 'better-auth'
import { z } from 'zod'

const eitaaUserSchema = z.object({
	id: z.union([z.number(), z.string()]),
	first_name: z.string().min(1),
	last_name: z.string().optional(),
	username: z.string().optional(),
	photo_url: z.string().url().optional(),
})

export function eitaaAuth_verifyInitData(
	initData: string,
	now = Math.floor(Date.now() / 1000),
	appToken = env.EITAA_APP_TOKEN,
) {
	const params = new URLSearchParams(initData)
	const receivedHash = params.get('hash')
	const authDate = Number(params.get('auth_date'))

	if (!receivedHash || !/^[a-f\d]{64}$/i.test(receivedHash) || !appToken) return null
	if (!Number.isSafeInteger(authDate) || authDate > now + 5 || now - authDate > 60) return null

	params.delete('hash')
	const dataCheckString = [...params.entries()]
		.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')
	const secret = createHmac('sha256', 'WebAppData').update(appToken).digest()
	const expectedHash = createHmac('sha256', secret).update(dataCheckString).digest()
	const actualHash = Buffer.from(receivedHash, 'hex')

	if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) return null

	try {
		return eitaaUserSchema.parse(JSON.parse(params.get('user') || ''))
	} catch {
		return null
	}
}

export function eitaaAuthPlugin() {
	return {
		id: 'eitaa-auth',
		endpoints: {
			signInEitaa: createAuthEndpoint(
				'/sign-in/eitaa',
				{ method: 'POST', body: z.object({ initData: z.string().min(1) }) },
				async (ctx) => {
					const profile = eitaaAuth_verifyInitData(ctx.body.initData)
					if (!profile) throw new APIError('UNAUTHORIZED', { message: 'اطلاعات ورود ایتا معتبر نیست.' })

					const accountId = String(profile.id)
					const currentSession = await getSessionFromCtx(ctx, { disableRefresh: true })
					const existingAccount = await ctx.context.internalAdapter.findAccountByProviderId(
						accountId,
						'eitaa',
					)
					let user = existingAccount
						? await ctx.context.internalAdapter.findUserById(existingAccount.userId)
						: currentSession?.user

					if (existingAccount && currentSession && existingAccount.userId !== currentSession.user.id) {
						throw new APIError('CONFLICT', { message: 'این حساب ایتا قبلاً متصل شده است.' })
					}

					if (!user) {
						user = await ctx.context.internalAdapter.createUser({
							name: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
							email: `eitaa-${accountId}@users.invalid`,
							emailVerified: false,
							image: profile.photo_url,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
					}

					if (!user) throw new APIError('INTERNAL_SERVER_ERROR', { message: 'ساخت حساب ناموفق بود.' })

					if (!existingAccount) {
						await ctx.context.internalAdapter.createAccount({ accountId, providerId: 'eitaa', userId: user.id })
					}

					const session = await ctx.context.internalAdapter.createSession(user.id)
					if (!session) throw new APIError('INTERNAL_SERVER_ERROR', { message: 'ساخت نشست ناموفق بود.' })
					await setSessionCookie(ctx, { session, user })
					return ctx.json({ user })
				},
			),
		},
	} satisfies BetterAuthPlugin
}
