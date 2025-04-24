<script lang="ts">
	import IconSupport from '~icons/ic/round-support-agent'
	import IconGithub from './IconGithub.svelte'

	const { class: className, supportLink } = $props()
</script>

<div class={[className, 'navbar bg-base-300 rounded-t-xl shadow-sm']}>
	<div class="navbar-start flex items-center">
		<a
			href={supportLink}
			class="btn !btn-ghost"
			class:!btn-disabled={!supportLink}
			target="_blank"
			rel="noopener"
		>
			<IconSupport class="vertical-middle inline-block size-6" />
			پشتیبانی
		</a>
	</div>
	<div class="navbar-center"></div>
	<div class="navbar-end flex items-center">
		<a
			class="btn !btn-ghost btn-square"
			href="https://github.com/sabereen/dorkhani"
			target="_blank"
			rel="noopener"
			aria-label="Github"
		>
			<IconGithub class="size-5" />
		</a>
	</div>
</div>
