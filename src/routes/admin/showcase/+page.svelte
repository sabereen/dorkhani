<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'
	import IconShowcaseDisabled from '~icons/ic/outline-campaign'
	import IconShowcaseEnabled from '~icons/ic/baseline-campaign'
	import IconLink from '~icons/ic/round-link'
	import { SvelteSet } from 'svelte/reactivity'
	import { fly, slide } from 'svelte/transition'
	import { showcase_save } from '$lib/entity/Showcase'
	import { handleError } from '$lib/utility/handleError'
	import { flip } from 'svelte/animate'
	import { watch } from '$lib/hooks/watch.svelte'

	const { data }: PageProps = $props()

	const MAX_LENGTH = 20

	const lastKhatms = $derived(Khatm.fromPlainList(data.lastKhatms))

	let autoShowcase = $state(data.autoShowcase)
	let loading = $state(false)
	let showcase = $state(Khatm.fromPlainList(data.showcaseKhatms))
	let showcaseSet = $derived(new SvelteSet(showcase.map((i) => i.id)))
	let isDirty = $state(false)

	function isInShowcase(khatm: Khatm) {
		return showcaseSet.has(khatm.id)
	}

	function toggleShowcase(khatm: Khatm) {
		isDirty = true

		if (isInShowcase(khatm)) {
			const index = showcase.findIndex((k) => k.id === khatm.id)
			if (~index) showcase.splice(index, 1)
		} else {
			showcase.push(khatm)
			showcase.sort((a, b) => a.id - b.id)
			if (showcase.length > MAX_LENGTH) {
				showcase.length = MAX_LENGTH
			}
		}
	}

	function save() {
		if (loading) return
		loading = true

		showcase_save({ showcase: showcase.map((k) => k.id), autoShowcase })
			.then(() => {
				isDirty = false
			})
			.catch(handleError)
			.finally(() => {
				loading = false
			})
	}

	watch(
		() => autoShowcase,
		() => {
			isDirty = true
		},
	)
</script>

<svelte:head>
	<title>ختم قرآن | ختم‌های صفحه اصلی</title>
</svelte:head>

<Header title="مدیریت ختم‌های صفحه اصلی" />

{#snippet khatmItem(khatm: Khatm)}
	<div class="flex min-w-0 grow basis-0 flex-col">
		<div>
			{khatm.title}
			<span class="badge badge-xs" class:badge-info={khatm.isAyahOriented}>
				{khatm.rangeTypeTitle}
			</span>
		</div>
		<p class="whitespace-pre-wrap text-xs opacity-85">{khatm.description}</p>
	</div>
	<div class="grid-gap-1 ms-auto grid shrink-0 grid-cols-2 items-center">
		<a class="btn btn-xs btn-primary btn-square !btn-ghost p-0" href={khatm.link} target="_blank">
			<IconLink class="size-5" />
		</a>
		<button
			class="btn btn-xs btn-primary btn-square !btn-ghost p-0"
			onclick={toggleShowcase.bind(null, khatm)}
		>
			{#if isInShowcase(khatm)}
				<IconShowcaseEnabled class="size-5 text-green-500" />
			{:else}
				<IconShowcaseDisabled class="size-5 opacity-75" />
			{/if}
		</button>
	</div>
{/snippet}

<section class="card card-border bg-base-200 mt-4">
	<div class="card-body">
		<h2 class="card-title">ختم‌های صفحه اصلی</h2>

		<label class="bg-base-100 mt-2 flex cursor-pointer items-center rounded-lg px-2 py-1 py-2">
			<input class="checkbox" type="checkbox" name="autoShowcase" bind:checked={autoShowcase} />
			<span class="ms-2 flex min-w-0 grow basis-0 flex-col">
				<span class="text-[.9rem] font-bold">ویترین خودکار</span>
				<p class="text-xs">
					بدون نیاز به تأیید مدیر آخرین ختم‌های عمومی در صفحه اصلی نمایش داده شوند.
				</p>
			</span>
		</label>

		{#if !autoShowcase}
			<ul class="list" in:fly={{ y: 50 }}>
				{#each showcase as khatm (khatm.id)}
					<li
						animate:flip={{ duration: 300 }}
						transition:fly={{ x: 20 }}
						class="list-row !flex w-full"
					>
						{@render khatmItem(khatm)}
					</li>
				{/each}
			</ul>
		{/if}

		<div class="card-actions justify-end">
			<button disabled={!isDirty} class="btn btn-primary" onclick={save}>
				{#if loading}
					<span transition:slide={{ axis: 'x' }} class="loading block"></span>
				{/if}
				ذخیره تغییرات
			</button>
		</div>
	</div>
</section>

<section class="card card-border bg-base-200 mt-4">
	<div class="card-body">
		<h2 class="card-title">آخرین ختم‌های عمومی</h2>
		<ul class="list">
			{#each lastKhatms as khatm (khatm.id)}
				<li class="list-row !flex w-full">
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
	</div>
</section>
