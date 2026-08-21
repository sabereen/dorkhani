import { createHash } from 'node:crypto'
import type { AiReviewStatus } from '@prisma-client'
import { generateText, NoObjectGeneratedError, Output } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { z } from 'zod'

import { db } from '$lib/server/db'
import { appSettings_store, type AiKhatmReviewConfig } from './appSettings'

export const AI_REVIEW_INITIAL_WAIT_MS = 4_000
export const AI_REVIEW_BACKGROUND_WAIT_MS = 30_000

type ReviewInput = {
	title: string
	description: string
}

export type AiReviewResult =
	| { status: 'pending'; reason: null }
	| { status: 'clear'; reason: null }
	| { status: 'warning'; reason: string }
	| { status: 'unavailable'; reason: string | null }
	| { status: 'disabled'; reason: null }

/**
 * Structured output returned by the model.
 *
 * The schema deliberately makes the two valid states explicit:
 * - clear   -> reason must be null
 * - warning -> reason must be a non-empty Persian string
 */
const aiResponseSchema = z.discriminatedUnion('verdict', [
	z.object({
		verdict: z.literal('clear'),
		reason: z.null(),
	}),
	z.object({
		verdict: z.literal('warning'),
		reason: z.string().trim().min(1).max(500),
	}),
])

type AiResponse = z.infer<typeof aiResponseSchema>

function contentHash({ title, description }: ReviewInput) {
	return createHash('sha256').update(`${title}\n${description}`).digest('hex')
}

function trimReason(reason: string | null | undefined) {
	const value = reason?.trim()
	return value ? value.slice(0, 500) : null
}

function getConfiguredReview() {
	const config = appSettings_store.config.aiKhatmReview

	if (!config.enabled || !config.baseUrl || !config.model || !config.apiKey) {
		return null
	}

	return config as Required<typeof config>
}

/**
 * Creates an OpenAI-compatible AI SDK provider dynamically
 * from the application settings.
 */
function createReviewProvider(
	config: Required<Pick<AiKhatmReviewConfig, 'baseUrl' | 'model' | 'apiKey'>>,
) {
	return createOpenAICompatible({
		name: 'khatm-review',
		baseURL: config.baseUrl.replace(/\/+$/, ''),
		apiKey: config.apiKey,
	})
}

/**
 * Tests the configured AI connection.
 */
export async function aiKhatmReview_testConnection(
	config: Required<Pick<AiKhatmReviewConfig, 'baseUrl' | 'model' | 'apiKey'>>,
	{ timeoutMs = 10_000 }: { timeoutMs?: number } = {},
) {
	const provider = createReviewProvider(config)

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)

	try {
		await generateText({
			model: provider(config.model),
			prompt: 'Reply with OK.',
			temperature: 0,
			abortSignal: controller.signal,
		})
	} finally {
		clearTimeout(timer)
	}
}

/**
 * Runs the actual AI review.
 *
 * The AI SDK is responsible for:
 * - sending the request
 * - requesting structured output
 * - parsing the model response
 * - validating the result against Zod
 *
 * No manual JSON.parse() is needed.
 */
export async function aiKhatmReview_review(
	input: ReviewInput,
	{ timeoutMs = AI_REVIEW_BACKGROUND_WAIT_MS }: { timeoutMs?: number } = {},
): Promise<AiReviewResult> {
	const config = getConfiguredReview()

	if (!config) {
		return {
			status: 'disabled',
			reason: null,
		}
	}

	const provider = createReviewProvider(config)

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)

	const systemPrompt = `
You review Persian group Quran-completion titles and descriptions.

Your task is to classify the title and description.

Return a structured result according to the provided schema.

Rules:

1. verdict = "clear"
   when the title and description are acceptable.

2. verdict = "warning"
   only when one of the following is true:
   - the title or description is gibberish or meaningless;
   - the content is contrary to Islamic ethics;
   - the user explicitly asks to complete only one specific surah or one specific part instead of the complete Quran.

3. A surah-based range/type alone is NOT a warning.

4. For "clear":
   reason must be null.

5. For "warning":
   reason must be a concise Persian explanation of the problem.

Do not invent reasons.
Do not flag content merely because it is short.
Do not flag a normal surah selection/range as a violation.
`

	try {
		const result = await generateText({
			model: provider(config.model),

			system: systemPrompt,

			prompt: JSON.stringify(
				{
					title: input.title,
					description: input.description,
				},
				null,
				2,
			),

			temperature: 0,

			output: Output.object({
				name: 'khatm_review',
				description:
					'Classification result for a Persian Quran-completion group title and description.',
				schema: aiResponseSchema,
			}),

			abortSignal: controller.signal,
		})

		/**
		 * At this point result.output is already:
		 *
		 * {
		 *   verdict: "clear" | "warning",
		 *   reason: null | string
		 * }
		 *
		 * and it has already passed Zod validation.
		 */
		const output: AiResponse = result.output

		if (output.verdict === 'clear') {
			return {
				status: 'clear',
				reason: null,
			}
		}

		return {
			status: 'warning',
			reason: trimReason(output.reason) || 'عنوان یا توضیح ختم نیاز به اصلاح دارد.',
		}
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('AI khatm review returned invalid structured output.', {
				error: error.message,
				cause: error.cause,
				text: error.text,
				response: error.response,
				usage: error.usage,
			})
		} else if (error instanceof Error) {
			console.error('AI khatm review failed.', {
				name: error.name,
				message: error.message,
			})
		} else {
			console.error('AI khatm review failed.', error)
		}

		return {
			status: 'unavailable',
			reason: null,
		}
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
	const review = await db.tAiKhatmReview.findUnique({
		where: { id },
	})

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
		where: {
			id,
			khatmId: null,
			status: 'warning',
		},
		data: {
			status: 'pending',
		},
	})

	if (reserved.count === 0) return null

	return review
}

export async function aiKhatmReview_attachWarning(id: string, khatmId: number) {
	await db.tAiKhatmReview.updateMany({
		where: {
			id,
			khatmId: null,
			status: 'pending',
		},
		data: {
			khatmId,
			status: 'warning',
			expiresAt: null,
		},
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
	const khatm = await db.tKhatm.findUnique({
		where: { id: khatmId },
	})

	if (!khatm) return

	const review = await db.tAiKhatmReview.findUnique({
		where: { khatmId },
	})

	if (review && review.contentHash !== contentHash(khatm)) {
		await db.$transaction([
			db.tAiKhatmReview.update({
				where: { id: review.id },
				data: {
					status: 'unavailable',
					deadline: null,
				},
			}),
			db.tKhatm.update({
				where: { id: khatmId },
				data: {
					aiReviewStatus: 'unavailable',
					aiReviewReason: null,
				},
			}),
		])

		return
	}

	const aiReviewStatus = result.status as AiReviewStatus

	await db.$transaction(async (tx) => {
		await tx.tAiKhatmReview.updateMany({
			where: {
				khatmId,
				status: 'pending',
			},
			data: {
				status: aiReviewStatus,
				reason: result.reason,
				deadline: null,
			},
		})

		await tx.tKhatm.update({
			where: { id: khatmId },
			data: {
				aiReviewStatus,
				aiReviewReason: result.reason,
			},
		})

		if (khatm.private || result.status === 'disabled') {
			return
		}

		if (result.status === 'clear' || result.status === 'warning') {
			await tx.tKhatm.updateMany({
				where: {
					id: khatmId,
					reviewStatus: 'pending',
				},
				data: {
					reviewStatus: result.status === 'clear' ? 'approved' : 'rejected',
				},
			})
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
		where: {
			khatmId: null,
			expiresAt: { lte: now },
		},
	})

	const expired = await db.tAiKhatmReview.findMany({
		where: {
			status: 'pending',
			deadline: { lt: now },
			khatmId: { not: null },
		},
		select: {
			khatmId: true,
		},
		take: 20,
	})

	await Promise.all(
		expired.map((review) =>
			aiKhatmReview_applyResult(review.khatmId!, {
				status: 'unavailable',
				reason: null,
			}),
		),
	)

	const pending = await db.tAiKhatmReview.findMany({
		where: {
			status: 'pending',
			deadline: { gte: now },
			khatmId: { not: null },
		},
		include: {
			khatm: {
				select: {
					title: true,
					description: true,
				},
			},
		},
		take: 20,
	})

	await Promise.all(
		pending
			.filter((review) => !schedulerState.runningKhatmIds.has(review.khatmId!))
			.map(async (review) => {
				const remaining = review.deadline!.getTime() - Date.now()

				if (remaining <= 0) return
				if (!review.khatm) return

				schedulerState.runningKhatmIds.add(review.khatmId!)

				try {
					const result = await aiKhatmReview_review(review.khatm, {
						timeoutMs: remaining,
					})

					await aiKhatmReview_applyResult(review.khatmId!, result)
				} finally {
					schedulerState.runningKhatmIds.delete(review.khatmId!)
				}
			}),
	)
}

type SchedulerState = {
	started: boolean
	active: Promise<void> | null
	runningKhatmIds: Set<number>
}

const globalForAiReview = globalThis as unknown as {
	aiKhatmReviewScheduler?: SchedulerState
}

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
