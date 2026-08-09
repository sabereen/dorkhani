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
			await khatm.refresh().catch()
			handleError(err)
			if ((err as App.Error)?.type === 'conflict-ranges') {
				onClose?.()
			}
		} finally {
			loading = false
		}
	}
</script>

{#if range}
	آیا قرائت این بازه را تقبل می‌کنید؟
	<p class="my-2 text-sm">
		{range.getTitle()}
		<a href={range.getLink(khatm)} target="_blank" class="ui-badge ui-badge-info ui-badge-outline h-6">
			مشاهده آیات
		</a>
	</p>

	<div>
		<button class="ui-btn ui-btn-primary mt-2" disabled={loading} onclick={markAsRead}>می‌پذیرم</button>
		<button class="ui-btn ui-btn-danger mt-2" disabled={loading} onclick={onClose}>لغو</button>
	</div>
{:else}
	<p class="text-lg">این بازه قبلا قرائت شده است.</p>
{/if}
