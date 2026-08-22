// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		Eitaa?: {
			WebApp?: {
				initData?: string
				colorScheme?: 'light' | 'dark'
				ready?: () => void
				expand?: () => void
				BackButton?: {
					show?: () => void
					hide?: () => void
					onClick?: (callback: () => void) => void
					offClick?: (callback: () => void) => void
				}
				SettingsButton?: {
					show?: () => void
					hide?: () => void
					onClick?: (callback: () => void) => void
					offClick?: (callback: () => void) => void
				}
			}
		}
		Bale?: {
			WebApp?: {
				initData?: string
				colorScheme?: 'light' | 'dark'
				ready?: () => void
				expand?: () => void
				BackButton?: {
					show?: () => void
					hide?: () => void
					onClick?: (callback: () => void) => void
					offClick?: (callback: () => void) => void
				}
				SettingsButton?: {
					show?: () => void
					hide?: () => void
					onClick?: (callback: () => void) => void
					offClick?: (callback: () => void) => void
				}
			}
		}
	}

	namespace App {
		type AuthSession = import('$lib/server/auth').AuthSession
		type ErrorType =
			/** به علت تداخل بازه‌ها امکان درج رکورد جدید نیست */
			'conflict-ranges' | 'khatm-deleted' | 'khatm-expired'

		interface Error {
			type?: ErrorType
			message: string
			name?: string
			stack?: string
			cause?: unknown
			path?: string
			status?: number
		}

		interface Locals {
			session: AuthSession['session'] | null
			user: AuthSession['user'] | null
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
