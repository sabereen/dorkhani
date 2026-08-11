<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconBook from '~icons/ic/round-menu-book'

	type Props = {
		range: QuranRange
		khatm: Khatm
		onClose: () => void
	}

	let { range, khatm, onClose }: Props = $props()
</script>

<div class="ui-khatm-confirm ui-khatm-confirm-success" role="status" aria-live="polite">
	<div class="ui-khatm-confirm-heading">
		<span class="ui-khatm-confirm-icon"><IconCheck /></span>
		<h2>این سهم برای شما ثبت شد</h2>
	</div>
	<p class="ui-text-muted text-sm">بازه‌ای که برای قرائت پذیرفتید:</p>
	<p class="ui-khatm-confirm-range">{range.getTitle()}</p>
	<div class="ui-khatm-confirm-actions">
		<a href={range.getLink(khatm)} class="ui-btn ui-btn-primary">
			<IconBook />
			مشاهده و قرائت آیات
		</a>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={onClose}>انتخاب سهم دیگر</button>
	</div>
</div>
