<script lang="ts">
	import IconSupport from '~icons/ic/round-support-agent'
	import IconGithub from './IconGithub.svelte'

	const { class: className, supportLink } = $props()
</script>

<footer class={[className, 'ui-border ui-bg-surface border-t']}>
	<div class="ui-container flex min-h-18 items-center justify-between">
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
