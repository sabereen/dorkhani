<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconBook from '~icons/ic/round-menu-book'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		range: QuranRange
		khatm: Khatm
		onClose: () => void
	}

	let { range, khatm, onClose }: Props = $props()
</script>

<div class="ui-khatm-confirm ui-khatm-confirm-success" role="status" aria-live="polite">
	<span class="ui-khatm-wizard-success-icon"><IconCheck /></span>
	<span class="ui-khatm-wizard-kicker">{m.wizard_selection_success()}</span>
	<h2>{m.wizard_share_reserved()}</h2>
	<p class="ui-khatm-confirm-description">
		{m.wizard_share_success_description()}
	</p>
	<div class="ui-khatm-confirm-range">
		<IconBook aria-hidden="true" />
		<div><span>{m.wizard_my_share()}</span><strong>{range.getTitle()}</strong></div>
	</div>
	<div class="ui-khatm-confirm-actions">
		<a href={range.getLink(khatm)} class="ui-btn ui-btn-primary">
			<IconBook />
			{m.wizard_view_read_ayahs()}
		</a>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={onClose}>{m.wizard_choose_another_share()}</button>
	</div>
</div>
