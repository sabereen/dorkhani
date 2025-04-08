import { toast } from '$lib/components/TheToast.svelte'

export function handleError(error: unknown) {
	console.dir(error)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	toast('error', (error as any)?.message || 'خطایی رخ داده است.')
}
