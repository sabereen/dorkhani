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
	<span class="ui-khatm-wizard-success-icon"><IconCheck /></span>
	<span class="ui-khatm-wizard-kicker">انتخاب با موفقیت انجام شد</span>
	<h2>این سهم برای شما کنار گذاشته شد</h2>
	<p class="ui-khatm-confirm-description">حالا می‌توانید آیات سهم خود را باز کنید و قرائت را آغاز کنید.</p>
	<div class="ui-khatm-confirm-range">
		<IconBook aria-hidden="true" />
		<div><span>سهم شما</span><strong>{range.getTitle()}</strong></div>
	</div>
	<div class="ui-khatm-confirm-actions">
		<a href={range.getLink(khatm)} class="ui-btn ui-btn-primary">
			<IconBook />
			مشاهده و قرائت آیات
		</a>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={onClose}>انتخاب سهم دیگر</button>
	</div>
</div>
