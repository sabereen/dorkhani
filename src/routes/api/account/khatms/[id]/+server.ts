import type { KhatmEditData } from '$lib/contracts/api'
import type { RangeType } from '$lib/contracts/domain'
import {
	KhatmHistoricalRoundError,
	KhatmOwnershipError,
	KhatmRangeLockedError,
	type KhatmManagementActor,
	khatmService_delete,
	khatmService_edit,
	khatmService_getForEdit,
} from '$service/khatm'
import { auth_checkIsAdmin, auth_ensureIsAdmin } from '$service/auth'
import { error, json, type RequestEvent, type RequestHandler } from '@sveltejs/kit'

type ManagementEvent = Pick<RequestEvent, 'locals' | 'request' | 'setHeaders' | 'url'>
const rangeTypes = new Set<RangeType>(['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'])

function getActor(event: ManagementEvent): KhatmManagementActor | null {
	if (event.url.searchParams.get('admin') === '1') {
		auth_ensureIsAdmin(event)
		return { kind: 'admin' }
	}
	if (auth_checkIsAdmin(event)) return { kind: 'admin' }
	return event.locals.user ? { kind: 'owner', ownerId: event.locals.user.id } : null
}

function readId(value: string | undefined) {
	const id = Number(value)
	if (!Number.isSafeInteger(id)) error(404, { message: 'ختم پیدا نشد.' })
	return id
}

function managementError(cause: unknown): never {
	if (cause instanceof KhatmOwnershipError) error(403, { message: 'اجازه مدیریت این ختم را ندارید.' })
	if (cause instanceof KhatmHistoricalRoundError) {
		error(409, { message: 'دورهای پایان‌یافته برای حفظ سابقه قابل تغییر نیستند.' })
	}
	if (cause instanceof KhatmRangeLockedError) {
		error(409, { message: 'پس از ثبت مشارکت، نوع بازه قابل تغییر نیست.' })
	}
	throw cause
}

export const GET: RequestHandler = async (event) => {
	const actor = getActor(event)
	if (!actor) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	try {
		const result = await khatmService_getForEdit(actor, readId(event.params.id))
		if (!result) error(404, { message: 'ختم پیدا نشد.' })
		return json({ ...result, isAdmin: actor.kind === 'admin' } satisfies KhatmEditData)
	} catch (cause) {
		managementError(cause)
	}
}

export const PUT: RequestHandler = async (event) => {
	const actor = getActor(event)
	if (!actor) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	const body = await event.request.json().catch(() => null)
	const title = typeof body?.title === 'string' ? body.title.trim() : ''
	const description = typeof body?.description === 'string' ? body.description.trim() : ''
	const rangeType = body?.rangeType as RangeType
	if (!title || title.length > 100) error(400, { message: 'عنوان معتبر نیست.' })
	if (!rangeTypes.has(rangeType)) error(400, { message: 'نوع بازه معتبر نیست.' })
	try {
		const result = await khatmService_edit(actor, readId(event.params.id), {
			title,
			description,
			rangeType,
			private: body?.private === true,
			disableSeries: body?.disableSeries === true,
		})
		if (!result) error(404, { message: 'ختم پیدا نشد.' })
		return json({ khatm: result })
	} catch (cause) {
		managementError(cause)
	}
}

export const DELETE: RequestHandler = async (event) => {
	const actor = getActor(event)
	if (!actor) error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })
	try {
		const deleted = await khatmService_delete(actor, readId(event.params.id))
		if (!deleted) error(404, { message: 'ختم پیدا نشد.' })
		return new Response(null, { status: 204 })
	} catch (cause) {
		managementError(cause)
	}
}
