import '@inlang/paraglide-js/urlpattern-polyfill'
import { building } from '$app/environment'
import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
import type { ServerInit, HandleServerError, Handle } from '@sveltejs/kit'
import { isManualColorScheme } from '$lib/entity/Theme'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { base } from '$app/paths'
import {
	INTERNAL_LOCALE_HEADER,
	PARAGLIDE_LOCALE_COOKIE,
	isLocale,
	localeDirection,
	resolveRequestLocale,
} from '$lib/i18n/locale'
import { defineCustomServerStrategy } from '$lib/paraglide/runtime.js'
import { paraglideMiddleware } from '$lib/paraglide/server.js'
import {
	createCorsHeaders,
	getAllowedCorsOrigin,
	isSameOrigin,
	parseTrustedOrigins,
} from '$lib/server/cors'

defineCustomServerStrategy('custom-preference', {
	getLocale: (request) => request?.headers.get(INTERNAL_LOCALE_HEADER) ?? undefined,
})

export const init: ServerInit = async () => {
	if (publicEnv.PUBLIC_BUILD_TARGET === 'capacitor') return
	const { appSettingsService_init } = await import('$service/appSettings')
	await appSettingsService_init()
	if (!building) {
		const [{ khatmCleanup_startScheduler }, { aiKhatmReview_startScheduler }] = await Promise.all([
			import('$service/khatmCleanup'),
			import('$service/aiKhatmReview'),
		])
		khatmCleanup_startScheduler()
		aiKhatmReview_startScheduler()
	}
}

export const handle: Handle = async ({ resolve, event }) => {
	const requestOrigin = event.request.headers.get('origin')
	const trustedOrigins = parseTrustedOrigins(privateEnv.NATIVE_TRUSTED_ORIGINS)
	const corsOrigin = getAllowedCorsOrigin(requestOrigin, trustedOrigins)
	if (event.request.method === 'OPTIONS' && corsOrigin) {
		return new Response(null, { status: 204, headers: createCorsHeaders(corsOrigin) })
	}
	if (requestOrigin && !corsOrigin && !isSameOrigin(requestOrigin, event.url)) {
		return new Response(null, { status: 403 })
	}

	if (publicEnv.PUBLIC_BUILD_TARGET === 'capacitor') return resolve(event)

	const [{ auth }, { db }] = await Promise.all([
		import('$lib/server/auth'),
		import('$lib/server/db'),
	])
	const canonicalAdmin = canonicalAdminUrl(event.url)
	if (canonicalAdmin) return Response.redirect(canonicalAdmin, 307)

	const authSession = await auth.api.getSession({ headers: event.request.headers })
	event.locals.session = authSession?.session ?? null
	event.locals.user = authSession?.user ?? null

	const cookieLocale = event.cookies.get(PARAGLIDE_LOCALE_COOKIE)
	const clientLocale = event.request.headers.get('x-app-locale')
	const accountLocale = authSession?.user?.locale
	const localeResolution = resolveRequestLocale({
		pathname: withoutBase(event.url.pathname),
		cookieLocale,
		clientLocale,
		accountLocale,
		acceptLanguage: event.request.headers.get('accept-language'),
	})
	event.locals.locale = localeResolution.locale
	event.locals.needsLocaleChoice = localeResolution.needsLocaleChoice

	if (event.locals.user && isLocale(cookieLocale) && cookieLocale !== accountLocale) {
		await db.user.update({
			where: { id: event.locals.user.id },
			data: { locale: cookieLocale },
		})
		event.locals.user.locale = cookieLocale
	} else if (!isLocale(cookieLocale) && isLocale(accountLocale)) {
		event.cookies.set(PARAGLIDE_LOCALE_COOKIE, accountLocale, {
			path: '/',
			maxAge: 365 * 24 * 60 * 60,
			sameSite: 'lax',
			httpOnly: false,
			secure: event.url.protocol === 'https:',
		})
	}

	const requestHeaders = new Headers(event.request.headers)
	requestHeaders.set(INTERNAL_LOCALE_HEADER, localeResolution.locale)
	event.request = new Request(event.request, { headers: requestHeaders })

	const response = await paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request
		event.locals.locale = locale
		return svelteKitHandler({
			auth,
			event,
			building,
			resolve: (currentEvent) =>
				resolve(currentEvent, {
					transformPageChunk(input) {
						let html = input.html.replace(
							'<html lang="fa" dir="rtl"',
							`<html lang="${locale}" dir="${localeDirection(locale)}"`,
						)
						const colorScheme = currentEvent.cookies.get('colorScheme')
						if (isManualColorScheme(colorScheme)) {
							html = html.replace('<html', `<html data-color-scheme="${colorScheme}"`)
						}
						return html
					},
				}),
		})
	})
	response.headers.delete('x-frame-options')
	if (!response.headers.has('content-security-policy')) {
		response.headers.set(
			'content-security-policy',
			"frame-ancestors 'self' https://*.bale.ai; frame-src 'self' https://*.bale.ai",
		)
	}
	if (corsOrigin) {
		const previousVary = response.headers.get('vary')
		for (const [name, value] of createCorsHeaders(corsOrigin)) response.headers.set(name, value)
		const varyIncludesOrigin = previousVary
			?.toLowerCase()
			.split(',')
			.map((value) => value.trim())
			.includes('origin')
		if (previousVary && !varyIncludesOrigin) {
			response.headers.set('vary', `${previousVary}, Origin`)
		}
	}
	return response
}

function withoutBase(pathname: string) {
	return base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname
}

function canonicalAdminUrl(url: URL) {
	const pathname = withoutBase(url.pathname)
	const match = /^\/(?:ar|en)(\/(?:admin|api\/admin)(?:\/.*)?$)/.exec(pathname)
	if (!match) return null
	const target = new URL(url)
	target.pathname = `${base}${match[1]}`
	return target
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const details = getErrorDetails(error)
	const report = {
		status,
		name: details.name,
		message: details.message || message,
		method: event.request.method,
		path: event.url.pathname,
		url: event.url.href,
		stack: details.stack ?? null,
		cause: details.cause ?? null,
	}

	// This must remain enabled in production: Mini Apps cannot be inspected easily,
	// so the deployment log is the source of truth for unexpected request failures.
	console.error('Unhandled SvelteKit request error:', report)

	if (publicEnv.PUBLIC_BUILD_TARGET !== 'capacitor') {
		void import('$service/admin-notification').then(({ getNotificationProvider }) => {
			getNotificationProvider()
				.sendError(`${status} ${report.message}`, report)
				.catch((notificationError) => {
					console.error('Failed to send unexpected-error notification:', notificationError)
				})
		})
	}

	return {
		status,
		name: details.name,
		message: report.message,
		path: event.url.pathname,

		// Intentionally exposed in production so Mini App users can copy the exact failure.
		stack: details.stack,
		cause: details.cause,
	}
}

function serializeCause(cause: unknown): unknown {
	if (cause == null) return null

	if (cause instanceof Error) {
		return {
			name: cause.name,
			message: cause.message,
			stack: cause.stack,
			cause: serializeCause(cause.cause),
		}
	}

	if (typeof cause === 'object') {
		try {
			return JSON.parse(JSON.stringify(cause))
		} catch {
			return String(cause)
		}
	}

	return cause
}

function getErrorDetails(error: unknown) {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
			cause: serializeCause(error.cause),
		}
	}

	if (typeof error === 'object' && error !== null) {
		const errorLike = error as {
			name?: unknown
			message?: unknown
			stack?: unknown
			cause?: unknown
		}

		try {
			return {
				name:
					typeof errorLike.name === 'string'
						? errorLike.name
						: error.constructor?.name ?? 'UnknownError',
				message:
					typeof errorLike.message === 'string' ? errorLike.message : JSON.stringify(error),
				stack: typeof errorLike.stack === 'string' ? errorLike.stack : undefined,
				cause: serializeCause(errorLike.cause),
			}
		} catch {
			return {
				name: 'UnknownError',
				message: String(error),
				stack: undefined,
				cause: undefined,
			}
		}
	}

	return {
		name: 'UnknownError',
		message: String(error),
		stack: undefined,
		cause: undefined,
	}
}

// export const handleError: HandleServerError = ({ error, event, status }) => {
// 	const details = getErrorDetails(error)

// 	return {
// 		status,
// 		name: details.name,
// 		message: details.message,
// 		path: event.url.pathname,

// 		// فقط در development
// 		stack: dev ? details.stack : undefined,
// 		cause: dev ? details.cause : undefined,
// 	}
// }
