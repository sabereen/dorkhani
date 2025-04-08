<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import { handleError } from '$lib/utility/handleError'

	type Props = {
		range: QuranRange | null
		khatm: Khatm
		onClose?: () => void
		onFinished?: () => void
	}

	let { range, khatm, onClose, onFinished }: Props = $props()

	let loading = $state(false)
	/** قسمت انتخاب شده را به عنوان خوانده شده علامت می‌زند */
	async function markAsRead() {
		if (loading || !range) return
		loading = true
		try {
			await khatm.pickRange(range)
			await khatm.refresh().catch()
			onFinished?.()
		} catch (err) {
			handleError(err)
			khatm.refresh()
		} finally {
			loading = false
		}
	}
</script>

{#if range}
	آیا قرائت این بازه را تقبل می‌کنید؟
	<p class="my-2 text-sm">
		{range.getTitle()}
		<a href={range.externalLink} target="_blank" class="badge badge-info badge-outline">
			مشاهده آیات
		</a>
	</p>

	<div>
		<button class="btn btn-primary mt-2" disabled={loading} onclick={markAsRead}>می‌پذیرم</button>
		<button class="btn btn-error mt-2" disabled={loading} onclick={onClose}>لغو</button>
	</div>
{:else}
	<p class="text-lg">این بازه قبلا قرائت شده است.</p>
{/if}
