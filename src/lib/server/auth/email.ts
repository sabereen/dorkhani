import { env } from '$env/dynamic/private'
import nodemailer from 'nodemailer'

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined

export function authEmail_isConfigured() {
	return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM)
}

function getTransporter() {
	if (transporter) return transporter

	const port = Number(env.SMTP_PORT || 587)
	if (!authEmail_isConfigured()) {
		throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM must be configured.')
	}

	transporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port,
		secure: env.SMTP_SECURE === '1' || port === 465,
		auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
	})

	return transporter
}

export async function authEmail_send(to: string, subject: string, text: string) {
	await getTransporter().sendMail({ from: env.SMTP_FROM, to, subject, text })
}
