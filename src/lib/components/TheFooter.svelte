<script lang="ts">
	import { base } from '$app/paths'
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
				پشتیبانی
			</a>
		</div>
		<nav class="ui-footer-legal-links" aria-label="پیوندهای حقوقی">
			<a class="ui-link" href={`${base}/privacy`}>حریم خصوصی</a>
			<a class="ui-link" href={`${base}/terms`}>شرایط استفاده</a>
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
