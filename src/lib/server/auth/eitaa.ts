import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '$env/dynamic/private'
import {
	APIError,
	createAuthEndpoint,
	formCsrfMiddleware,
	getSessionFromCtx,
} from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import type { BetterAuthPlugin } from 'better-auth'
import { z } from 'zod'

const EITAA_INIT_DATA_MAX_AGE_SECONDS = 300

const eitaaUserSchema = z.object({
	id: z.union([z.number(), z.string()]),
	first_name: z.string().min(1),
	last_name: z.string().nullish(),
	username: z.string().nullish(),
	photo_url: z.string().url().nullish(),
	allows_write_to_pm: z.boolean().nullish(),
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
	if (
		!Number.isSafeInteger(authDate) ||
		authDate > now + 5 ||
		now - authDate > EITAA_INIT_DATA_MAX_AGE_SECONDS
	)
		return null

	params.delete('hash')
	const dataCheckString = [...params.entries()]
		.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')
	const secret = createHmac('sha256', 'WebAppData').update(appToken).digest()
	const expectedHash = createHmac('sha256', secret).update(dataCheckString).digest()
	const actualHash = Buffer.from(receivedHash, 'hex')

	if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash))
		return null

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
				{
					method: 'POST',
					requireHeaders: true,
					use: [formCsrfMiddleware],
					body: z.object({
						initData: z.string().min(1),
						intent: z.enum(['auto', 'link-current', 'use-eitaa']).default('auto'),
					}),
				},
				async (ctx) => {
					const profile = eitaaAuth_verifyInitData(ctx.body.initData)
					if (!profile)
						throw new APIError('UNAUTHORIZED', { message: 'اطلاعات ورود ایتا معتبر نیست.' })

					const profileName =
						[profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
						profile.username ||
						'کاربر ایتا'
					const accountId = String(profile.id)
					const currentSession = await getSessionFromCtx(ctx, { disableRefresh: true })
					const existingAccount = await ctx.context.internalAdapter.findAccountByProviderId(
						accountId,
						'eitaa',
					)

					if (ctx.body.intent === 'auto' && currentSession) {
						if (!existingAccount) {
							return ctx.json({ status: 'choice-required', reason: 'unlinked' as const })
						}
						if (existingAccount.userId !== currentSession.user.id) {
							return ctx.json({ status: 'choice-required', reason: 'different-account' as const })
						}
					}

					if (ctx.body.intent === 'link-current') {
						if (!currentSession) {
							throw new APIError('UNAUTHORIZED', {
								message: 'نشست فعلی برای اتصال حساب پیدا نشد.',
							})
						}
						if (existingAccount && existingAccount.userId !== currentSession.user.id) {
							throw new APIError('CONFLICT', {
								message: 'این حساب ایتا قبلاً به حساب دیگری متصل است.',
							})
						}
					}

					let user =
						ctx.body.intent === 'link-current'
							? currentSession?.user
							: existingAccount
								? await ctx.context.internalAdapter.findUserById(existingAccount.userId)
								: ctx.body.intent === 'auto'
									? currentSession?.user
									: null

					if (!user) {
						user = await ctx.context.internalAdapter.createUser({
							name: profileName,
							email: `eitaa-${accountId}@users.invalid`,
							emailVerified: false,
							image: profile.photo_url ?? undefined,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
					}

					if (!user)
						throw new APIError('INTERNAL_SERVER_ERROR', { message: 'ساخت حساب ناموفق بود.' })

					if (!user.name?.trim()) {
						user = await ctx.context.internalAdapter.updateUser(user.id, {
							name: profileName,
							image: profile.photo_url ?? undefined,
						})
					}

					if (!existingAccount) {
						await ctx.context.internalAdapter.createAccount({
							accountId,
							providerId: 'eitaa',
							userId: user.id,
						})
					}
					const { userNotification_upsertEndpoint } = await import('$service/user-notification')
					const notificationEndpoint = await userNotification_upsertEndpoint(
						user.id,
						'eitaa',
						accountId,
						profile.allows_write_to_pm ?? undefined,
					)

					if (currentSession?.user.id === user.id) {
						return ctx.json({
							status: 'authenticated',
							user,
							allowsWriteToPm: notificationEndpoint.canSend,
						})
					}

					const session = await ctx.context.internalAdapter.createSession(user.id)
					if (!session)
						throw new APIError('INTERNAL_SERVER_ERROR', { message: 'ساخت نشست ناموفق بود.' })
					await setSessionCookie(ctx, { session, user })
					return ctx.json({
						status: 'authenticated',
						user,
						allowsWriteToPm: notificationEndpoint.canSend,
					})
				},
			),
		},
	} satisfies BetterAuthPlugin
}
