<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'
	import IconShowcaseDisabled from '~icons/ic/outline-campaign'
	import IconShowcaseEnabled from '~icons/ic/baseline-campaign'
	import IconLink from '~icons/ic/round-link'
	import { SvelteSet } from 'svelte/reactivity'
	import { slide } from 'svelte/transition'
	import { showcase_save } from '$lib/entity/Showcase'
	import { handleError } from '$lib/utility/handleError'
	import { flip } from 'svelte/animate'

	const { data }: PageProps = $props()

	const lastKhatms = $derived(Khatm.fromPlainList(data.lastKhatms))

	const MAX_LENGTH = 20

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
			showcase.sort((a, b) => b.id - a.id)
			if (showcase.length > MAX_LENGTH) {
				showcase.length = MAX_LENGTH
			}
		}
	}

	function save() {
		if (loading) return
		loading = true

		showcase_save(showcase.map((k) => k.id))
			.then(() => {
				isDirty = false
			})
			.catch(handleError)
			.finally(() => {
				loading = false
			})
	}
</script>

<svelte:head>
	<title>ختم قرآن | ختم‌های صفحه اصلی</title>
</svelte:head>

<Header title="مدیریت ختم‌های صفحه اصلی" />

{#snippet khatmItem(khatm: Khatm)}
	<div class="flex flex-col">
		<div>
			{khatm.title}
			<span class="badge badge-xs" class:badge-info={khatm.isAyahOriented}>
				{khatm.rangeTypeTitle}
			</span>
		</div>
		<p class="whitespace-pre-wrap text-xs opacity-85">{khatm.description}</p>
	</div>
	<div class="grid-gap-1 ms-auto grid grid-cols-2 items-center">
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
		<ul class="list">
			{#each showcase as khatm (khatm.id)}
				<li animate:flip class="list-row w-full">
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
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
		<h2 class="card-title">آخرین ختم‌های ثبت شده</h2>
		<ul class="list">
			{#each lastKhatms as khatm (khatm.id)}
				<li class="list-row w-full">
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
	</div>
</section>
