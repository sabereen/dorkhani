// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		type ErrorType =
			/** به علت تداخل بازه‌ها امکان درج رکورد جدید نیست */
			'conflict-ranges'

		interface Error {
			type?: ErrorType
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
