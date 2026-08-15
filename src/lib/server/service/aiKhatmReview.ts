import { createHash } from 'node:crypto'
import type { AiReviewStatus } from '@prisma-client'
import { z } from 'zod'
import { db } from '$lib/server/db'
import { appSettings_store } from './appSettings'

export const AI_REVIEW_INITIAL_WAIT_MS = 4_000
export const AI_REVIEW_BACKGROUND_WAIT_MS = 30_000

type ReviewInput = { title: string; description: string }

export type AiReviewResult =
	| { status: 'pending'; reason: null }
	| { status: 'clear'; reason: null }
	| { status: 'warning'; reason: string }
	| { status: 'unavailable'; reason: string | null }
	| { status: 'disabled'; reason: null }

const aiResponseSchema = z.object({
	verdict: z.enum(['clear', 'warning']),
	reason: z.string().trim().max(500).optional(),
})

function contentHash({ title, description }: ReviewInput) {
	return createHash('sha256').update(`${title}\n${description}`).digest('hex')
}

function trimReason(reason: string | null | undefined) {
	const value = reason?.trim()
	return value ? value.slice(0, 500) : null
}

function getConfiguredReview() {
	const config = appSettings_store.config.aiKhatmReview
	if (!config.enabled || !config.baseUrl || !config.model || !config.apiKey) return null
	return config as Required<typeof config>
}

function parseResponseContent(content: unknown) {
	if (typeof content === 'object' && content != null) return content
	if (typeof content !== 'string') return null
	const json = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
	try {
		return JSON.parse(json)
	} catch {
		return null
	}
}

export async function aiKhatmReview_review(
	input: ReviewInput,
	{ timeoutMs = AI_REVIEW_BACKGROUND_WAIT_MS }: { timeoutMs?: number } = {},
): Promise<AiReviewResult> {
	const config = getConfiguredReview()
	if (!config) return { status: 'disabled', reason: null }

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify({
				model: config.model,
				temperature: 0,
				messages: [
					{
						role: 'system',
						content:
							'You review Persian group Quran-completion titles and descriptions. Return only JSON. Warn only for gibberish, content contrary to Islamic ethics, or a request to complete only one specific surah/part instead of the complete Quran. A surah-based range type alone is not a warning. Use a concise Persian reason when warning.',
					},
					{
						role: 'user',
						content: JSON.stringify(input),
					},
				],
			}),
			signal: controller.signal,
		})
		if (!response.ok) throw new Error(`AI HTTP ${response.status}`)
		const payload = await response.json()
		const parsed = aiResponseSchema.safeParse(parseResponseContent(payload?.choices?.[0]?.message?.content))
		if (!parsed.success) throw new Error('AI response format is invalid')
		if (parsed.data.verdict === 'clear') return { status: 'clear', reason: null }
		return {
			status: 'warning',
			reason: trimReason(parsed.data.reason) || 'عنوان یا توضیح ختم نیاز به اصلاح دارد.',
		}
	} catch (error) {
		console.warn('AI khatm review is unavailable.', error)
		return { status: 'unavailable', reason: null }
	} finally {
		clearTimeout(timer)
	}
}

export async function aiKhatmReview_createWarning(input: ReviewInput, reason: string) {
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
	return db.tAiKhatmReview.create({
		data: {
			contentHash: contentHash(input),
			status: 'warning',
			reason: trimReason(reason),
			expiresAt,
		},
		select: { id: true },
	})
}

export async function aiKhatmReview_consumeWarning(id: string, input: ReviewInput) {
	const review = await db.tAiKhatmReview.findUnique({ where: { id } })
	if (
		!review ||
		review.khatmId != null ||
		review.status !== 'warning' ||
		review.contentHash !== contentHash(input) ||
		(review.expiresAt != null && review.expiresAt <= new Date())
	) {
		return null
	}
	const reserved = await db.tAiKhatmReview.updateMany({
		where: { id, khatmId: null, status: 'warning' },
		data: { status: 'pending' },
	})
	if (reserved.count === 0) return null
	return review
}

export async function aiKhatmReview_attachWarning(id: string, khatmId: number) {
	await db.tAiKhatmReview.updateMany({
		where: { id, khatmId: null, status: 'pending' },
		data: { khatmId, status: 'warning', expiresAt: null },
	})
}

export async function aiKhatmReview_createForKhatm(
	khatmId: number,
	input: ReviewInput,
	result: AiReviewResult,
	deadline?: Date,
) {
	const status = result.status as AiReviewStatus
	return db.tAiKhatmReview.create({
		data: {
			khatmId,
			contentHash: contentHash(input),
			status,
			reason: result.reason,
			deadline,
		},
	})
}

export async function aiKhatmReview_applyResult(khatmId: number, result: AiReviewResult) {
	const khatm = await db.tKhatm.findUnique({ where: { id: khatmId } })
	if (!khatm) return
	const review = await db.tAiKhatmReview.findUnique({ where: { khatmId } })
	if (review && review.contentHash !== contentHash(khatm)) {
		await db.$transaction([
			db.tAiKhatmReview.update({
				where: { id: review.id },
				data: { status: 'unavailable', deadline: null },
			}),
			db.tKhatm.update({
				where: { id: khatmId },
				data: { aiReviewStatus: 'unavailable', aiReviewReason: null },
			}),
		])
		return
	}

	const aiReviewStatus = result.status as AiReviewStatus
	await db.$transaction(async (tx) => {
		await tx.tAiKhatmReview.updateMany({
			where: { khatmId, status: 'pending' },
			data: { status: aiReviewStatus, reason: result.reason, deadline: null },
		})
		await tx.tKhatm.update({
			where: { id: khatmId },
			data: { aiReviewStatus, aiReviewReason: result.reason },
		})
		if (khatm.private || result.status === 'disabled') return
		if (result.status === 'clear' || result.status === 'warning') {
			await tx.tKhatm.updateMany({
				where: { id: khatmId, reviewStatus: 'pending' },
				data: {
					reviewStatus: result.status === 'clear' ? 'approved' : 'rejected',
				},
			})
			return
		}
	})
}

export function aiKhatmReview_continue(khatmId: number, pendingReview: Promise<AiReviewResult>) {
	schedulerState.runningKhatmIds.add(khatmId)
	void pendingReview
		.then((result) => aiKhatmReview_applyResult(khatmId, result))
		.catch((error) => {
			console.error('Failed to apply delayed AI khatm review.', error)
		})
		.finally(() => schedulerState.runningKhatmIds.delete(khatmId))
}

export async function aiKhatmReview_processPending() {
	const now = new Date()
	await db.tAiKhatmReview.deleteMany({
		where: { khatmId: null, expiresAt: { lte: now } },
	})
	const expired = await db.tAiKhatmReview.findMany({
		where: { status: 'pending', deadline: { lt: now }, khatmId: { not: null } },
		select: { khatmId: true },
		take: 20,
	})
	await Promise.all(
		expired.map((review) =>
			aiKhatmReview_applyResult(review.khatmId!, { status: 'unavailable', reason: null }),
		),
	)
	const pending = await db.tAiKhatmReview.findMany({
		where: { status: 'pending', deadline: { gte: now }, khatmId: { not: null } },
		include: { khatm: { select: { title: true, description: true } } },
		take: 20,
	})
	await Promise.all(
		pending.filter((review) => !schedulerState.runningKhatmIds.has(review.khatmId!)).map(async (review) => {
			const remaining = review.deadline!.getTime() - Date.now()
			if (remaining <= 0) return
			if (!review.khatm) return
			schedulerState.runningKhatmIds.add(review.khatmId!)
			try {
				const result = await aiKhatmReview_review(review.khatm, { timeoutMs: remaining })
				await aiKhatmReview_applyResult(review.khatmId!, result)
			} finally {
				schedulerState.runningKhatmIds.delete(review.khatmId!)
			}
		}),
	)
}

type SchedulerState = { started: boolean; active: Promise<void> | null; runningKhatmIds: Set<number> }
const globalForAiReview = globalThis as unknown as { aiKhatmReviewScheduler?: SchedulerState }
const schedulerState = globalForAiReview.aiKhatmReviewScheduler ?? {
	started: false,
	active: null,
	runningKhatmIds: new Set<number>(),
}
globalForAiReview.aiKhatmReviewScheduler = schedulerState

function runScheduler() {
	if (schedulerState.active) return
	schedulerState.active = aiKhatmReview_processPending()
		.catch((error) => console.error('Failed to process pending AI khatm reviews.', error))
		.finally(() => {
			schedulerState.active = null
		})
}

export function aiKhatmReview_startScheduler() {
	if (schedulerState.started) return
	schedulerState.started = true
	runScheduler()
	const interval = setInterval(runScheduler, 10_000)
	interval.unref?.()
}
