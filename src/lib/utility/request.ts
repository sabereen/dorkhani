import { apiUrl } from '$lib/config/runtime'
import { authTokenStore, type AuthTokenStore } from '$lib/auth-token'
import { error } from '@sveltejs/kit'

export class ApiError extends Error {
	constructor(
		public status: number,
		public body: unknown,
		message: string,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

type RequestOptions = {
	body?: object | FormData
	fetch?: typeof globalThis.fetch
	origin?: string
	headers?: HeadersInit
	retry?: number
	tokenStore?: AuthTokenStore
}

export async function apiRequest<T>(
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const fetcher = options.fetch ?? globalThis.fetch
	const url = new URL(apiUrl(path, options.origin), options.origin ?? 'http://localhost')
	const headers = new Headers(options.headers)
	const tokenStore = options.tokenStore ?? authTokenStore
	const token = tokenStore.get()
	if (token) headers.set('authorization', `Bearer ${token}`)
	if (typeof localStorage !== 'undefined') {
		try {
			const settings = JSON.parse(localStorage.getItem('app_v1_localSettings') || '{}')
			if (settings.locale === 'fa' || settings.locale === 'ar' || settings.locale === 'en') {
				headers.set('x-app-locale', settings.locale)
			}
		} catch {
			// Invalid local preferences must not block a request.
		}
	}

	let requestBody: BodyInit | null = null
	if (method === 'GET' && options.body && !(options.body instanceof FormData)) {
		for (const [key, value] of Object.entries(options.body)) {
			if (value != null) url.searchParams.append(key, String(value))
		}
	} else if (options.body instanceof FormData) {
		requestBody = options.body
	} else if (options.body != null) {
		headers.set('content-type', 'application/json')
		requestBody = JSON.stringify(options.body)
	}

	const retries = options.retry ?? (method === 'GET' ? 1 : 0)
	let response: Response | undefined
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			response = await fetcher(url.href, { method, body: requestBody, headers })
		} catch (cause) {
			if (attempt === retries) throw cause
			continue
		}
		if (![502, 503, 504].includes(response.status) || attempt === retries) break
	}
	if (!response) throw new Error('Network request failed.')
	if (!response.ok) {
		if (response.status === 401 && token) tokenStore.clear()
		const body = await response.json().catch(() => null)
		const message =
			body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
				? body.message
				: 'خطایی رخ داده است.'
		throw new ApiError(response.status, body, message)
	}
	const refreshedToken = response.headers.get('set-auth-token')
	if (refreshedToken) tokenStore.set(refreshedToken)
	if (response.status === 204) return undefined as T
	return response.json() as Promise<T>
}

export async function loadApi<T>(
	path: string,
	input: { fetch: typeof globalThis.fetch; origin: string; body?: object },
) {
	try {
		return await apiRequest<T>('GET', path, input)
	} catch (cause) {
		if (cause instanceof ApiError) {
			const details = cause.body && typeof cause.body === 'object' ? cause.body : {}
			error(cause.status, { ...details, message: cause.message })
		}
		throw cause
	}
}

export async function request<T>(
	method: 'get' | 'post' | 'put' | 'delete',
	path: string,
	body?: object,
): Promise<T> {
	return apiRequest<T>(method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE', path, {
		body,
		origin: location.origin,
	})
}
