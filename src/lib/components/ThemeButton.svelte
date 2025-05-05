<script lang="ts">
	import { LocalSettings } from '$lib/entity/LocalSettings.svelte'
	import type { DaisyThemeSlug } from '$lib/entity/Theme'

	type Props = {
		theme: DaisyThemeSlug
		title: string
	}

	const { theme, title }: Props = $props()

	const id = $props.id()

	const settings = LocalSettings.use()

	function handleClick() {
		const editor = settings.edit()
		editor.config.daisyTheme = theme
		editor.commit()
	}
</script>

<button
	{id}
	class="outline-base-content overflow-hidden rounded-lg text-right"
	onclick={handleClick}
>
	<span
		data-theme={theme}
		class="bg-base-100 text-base-content font-inherit block w-full cursor-pointer"
	>
		<span class="grid grid-cols-5 grid-rows-3">
			<span class="col-span-5 row-span-3 row-start-1 flex items-center gap-2 px-4 py-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="h-3 w-3 shrink-0"
					class:invisible={settings.config.daisyTheme !== theme}
				>
					<path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"></path>
				</svg>
				<span class="min-w-0 flex-grow truncate text-xs">{title}</span>
				<span class="flex h-full flex-shrink-0 flex-wrap gap-1">
					<span class="bg-primary w-2 rounded"></span>
					<span class="bg-secondary w-2 rounded"></span>
					<span class="bg-accent w-2 rounded"> </span>
					<span class="bg-neutral w-2 rounded"></span>
				</span>
			</span>
		</span>
	</span>
</button>
