<script lang="ts">
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import IconSupport from '~icons/ic/round-support-agent'
	import IconGithub from './IconGithub.svelte'

	const { class: className, supportLink } = $props()
</script>

<footer class={[className, 'ui-border ui-bg-surface border-t']}>
	<div class="ui-container ui-footer-content">
		<div class="flex items-center">
			<a
				href={supportLink}
				class="ui-btn ui-btn-ghost"
				class:ui-btn-disabled={!supportLink}
				aria-disabled={!supportLink}
				target="_blank"
				rel="noopener"
			>
				<IconSupport class="vertical-middle inline-block size-6" />
				{m.footer_support()}
			</a>
		</div>
		<nav class="ui-footer-legal-links" aria-label={m.footer_legal_label()}>
			<a class="ui-link" href={localizeHref(`${base}/privacy`)}>{m.footer_privacy()}</a>
			<a class="ui-link" href={localizeHref(`${base}/terms`)}>{m.footer_terms()}</a>
		</nav>
		<div class="flex items-center">
			<a
				class="ui-btn ui-btn-ghost ui-btn-square"
				href="https://github.com/sabereen/dorkhani"
				target="_blank"
				rel="noopener"
				aria-label="Github"
			>
				<IconGithub class="size-5" />
			</a>
		</div>
	</div>
</footer>
