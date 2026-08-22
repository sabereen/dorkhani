<script lang="ts">
	import { onMount } from 'svelte'
	import { resolveClientLocale } from '$lib/i18n/locale'
	import { setLocale, type Locale } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'

	let { unresolved }: { unresolved: boolean } = $props()
	let visible = $state(false)

	onMount(() => {
		if (!unresolved) return
		const detected = resolveClientLocale()
		if (detected) {
			void setLocale(detected)
			return
		}
		visible = true
	})

	function choose(locale: Locale) {
		visible = false
		void setLocale(locale)
	}
</script>

{#if visible}
	<div class="fixed top-0 right-0 bottom-0 left-0 z-1200 flex items-center justify-center bg-black/45 p-4" role="presentation">
		<section class="ui-card ui-card-bordered w-full max-w-110" role="dialog" aria-modal="true" aria-labelledby="locale-chooser-title">
			<div class="ui-card-body text-center">
				<h2 id="locale-chooser-title" class="ui-card-title">{m.language_chooser_title()}</h2>
				<p class="ui-text-muted">{m.language_chooser_description()}</p>
				<div class="-m-1 flex flex-wrap justify-center">
					<button class="ui-btn ui-btn-outline m-1" type="button" onclick={() => choose('fa')}>فارسی</button>
					<button class="ui-btn ui-btn-outline m-1" type="button" onclick={() => choose('ar')}>العربية</button>
					<button class="ui-btn ui-btn-outline m-1" type="button" onclick={() => choose('en')}>English</button>
				</div>
			</div>
		</section>
	</div>
{/if}
