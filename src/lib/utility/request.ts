import { base } from '$app/paths'

export async function request<T>(method: 'get' | 'post', path: string, body?: object): Promise<T> {
	const url = new URL(`${base}/api${path}`, location.origin)

	if (body != null && method === 'get') {
		for (const key in body) {
			url.searchParams.append(key, String(body[key as keyof typeof body]))
		}
	}

	const postBody = method === 'post' ? JSON.stringify(body) : null

	const response = await fetch(url, {
		method,
		body: postBody,
		headers: { 'Content-Type': 'application/json' },
	})

	if (response.status < 200 || response.status >= 300) {
		const result = await response.json().catch()
		throw result || new Error('خطایی رخ داده است.')
	}

	const result = await response.json()
	return result
}
