// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		Eitaa?: { WebApp?: { initData?: string } }
	}

	namespace App {
		type AuthSession = import('$lib/server/auth').AuthSession
		type ErrorType =
			/** به علت تداخل بازه‌ها امکان درج رکورد جدید نیست */
			'conflict-ranges' | 'khatm-deleted' | 'khatm-expired'

		interface Error {
			type?: ErrorType
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
