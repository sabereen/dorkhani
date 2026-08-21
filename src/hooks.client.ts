import './polyfill'
import { base } from '$app/paths'
import type { ClientInit, HandleClientError } from '@sveltejs/kit'

type ClientErrorReport = {
	source: 'sveltekit' | 'window.error' | 'unhandledrejection'
	status: number
	name: string
	message: string
	stack: string | null
	cause: unknown
	url: string
	path: string
	filename?: string
	line?: number
	column?: number
}

const reportedErrors = new Set<string>()

export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const details = getErrorDetails(error)
	const report: ClientErrorReport = {
		source: 'sveltekit',
		status,
		name: details.name,
		message: details.message || message,
		stack: details.stack,
		cause: details.cause,
		url: event.url.href,
		path: event.url.pathname,
	}

	reportClientError(report)

	return {
		name: report.name,
		message: report.message,
		stack: report.stack ?? undefined,
		cause: report.cause,
		path: report.path,
		status,
	}
}

export const init: ClientInit = () => {
	window.addEventListener('error', (event) => {
		const details = getErrorDetails(event.error ?? new Error(event.message || 'Unknown browser error'))
		reportClientError({
			source: 'window.error',
			status: 500,
			name: details.name,
			message: details.message,
			stack: details.stack,
			cause: details.cause,
			url: window.location.href,
			path: window.location.pathname,
			filename: event.filename || undefined,
			line: event.lineno || undefined,
			column: event.colno || undefined,
		})
	})

	window.addEventListener('unhandledrejection', (event) => {
		const details = getErrorDetails(event.reason)
		reportClientError({
			source: 'unhandledrejection',
			status: 500,
			name: details.name,
			message: details.message,
			stack: details.stack,
			cause: details.cause,
			url: window.location.href,
			path: window.location.pathname,
		})
	})
}

function reportClientError(report: ClientErrorReport) {
	const fingerprint = [report.source, report.name, report.message, report.stack, report.path].join('|')
	if (reportedErrors.has(fingerprint)) return
	reportedErrors.add(fingerprint)

	void fetch(`${base}/api/client-error`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(report),
		keepalive: true,
	}).catch(() => {})
}

function getErrorDetails(error: unknown) {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack ?? null,
			cause: serializeCause(error.cause),
		}
	}

	if (typeof error === 'object' && error !== null) {
		const errorLike = error as { name?: unknown; message?: unknown; stack?: unknown; cause?: unknown }
		return {
			name: typeof errorLike.name === 'string' ? errorLike.name : 'UnknownError',
			message:
				typeof errorLike.message === 'string' ? errorLike.message : stringifyError(error),
			stack: typeof errorLike.stack === 'string' ? errorLike.stack : null,
			cause: serializeCause(errorLike.cause),
		}
	}

	return {
		name: 'UnknownError',
		message: String(error),
		stack: null,
		cause: null,
	}
}

function serializeCause(cause: unknown): unknown {
	if (cause == null) return null
	if (cause instanceof Error) return getErrorDetails(cause)
	if (typeof cause === 'object') return stringifyError(cause)
	return cause
}

function stringifyError(value: unknown) {
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}
