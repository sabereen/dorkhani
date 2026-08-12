import { base } from '$app/paths'

export async function request<T>(
	method: 'get' | 'post' | 'put',
	path: string,
	body?: object,
): Promise<T> {
	const url = new URL(`${base}/api${path}`, location.origin)

	if (body != null && method === 'get') {
		for (const key in body) {
			const value = body[key as keyof typeof body]
			if (value == null) continue
			url.searchParams.append(key, String(value))
		}
	}

	const requestBody = method === 'post' || method === 'put' ? JSON.stringify(body) : null

	const response = await fetch(url, {
		method,
		body: requestBody,
		headers: { 'Content-Type': 'application/json' },
	})

	if (response.status < 200 || response.status >= 300) {
		const result = await response.json().catch()
		throw result || new Error('خطایی رخ داده است.')
	}

	const result = await response.json()
	return result
}
