import type { TKhatm } from '@prisma/client'
import { PRIVATE_KHATM_SECRET } from './config'

export const rawPrivateKhatmKey = await crypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(PRIVATE_KHATM_SECRET),
	{ name: 'HMAC', hash: 'SHA-256' },
	false,
	['sign', 'verify'],
)

export async function signPrivateKhatm(khatm: TKhatm) {
	const text = khatm.created.toString() + khatm.id

	const signatureBuffer = await crypto.subtle.sign(
		'HMAC',
		rawPrivateKhatmKey,
		new TextEncoder().encode(text),
	)

	const token = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')

	return token
}

export async function verifyPrivateKhatm(khatm: TKhatm, token: string) {
	const text = khatm.created.toString() + khatm.id

	try {
		const signature = Uint8Array.from(
			atob(token.replace(/-/g, '+').replace(/_/g, '/')),
			(c: string) => c.charCodeAt(0),
		)

		return await crypto.subtle.verify(
			'HMAC',
			rawPrivateKhatmKey,
			signature,
			new TextEncoder().encode(text),
		)
	} catch {
		return false
	}
}
