<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
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

	const { data }: PageProps = $props()

	const MAX_LENGTH = 20

	const lastKhatms = $derived(Khatm.fromPlainList(data.lastKhatms))

	let loading = $state(false)
	let showcase = $state(
		Khatm.fromPlainList(/* svelte-ignore state_referenced_locally */ data.showcaseKhatms),
	)
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

		showcase_save({ showcase: showcase.map((k) => k.id) })
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
	<title>ختم قرآن | ختم‌های برگزیده</title>
</svelte:head>

<Header title="مدیریت ختم‌های برگزیده" />

{#snippet khatmItem(khatm: Khatm)}
	<KhatmListCard
		{khatm}
		meta={isInShowcase(khatm) ? 'ختم برگزیده' : 'ختم عمومی تأییدشده'}
		showDescription
	>
		{#snippet actions()}
			<a
				class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
				href={khatm.link}
				target="_blank"
				aria-label={`مشاهده ختم ${khatm.title}`}><IconLink /></a
			>
			<button
				class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
				type="button"
				aria-label={isInShowcase(khatm) ? 'حذف از برگزیده‌ها' : 'افزودن به برگزیده‌ها'}
				onclick={toggleShowcase.bind(null, khatm)}
			>
				{#if isInShowcase(khatm)}
					<IconShowcaseEnabled class="text-green-500" />
				{:else}
					<IconShowcaseDisabled class="opacity-75" />
				{/if}
			</button>
		{/snippet}
	</KhatmListCard>
{/snippet}


<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">ختم‌های برگزیده</h2>

		<ul class="ui-khatm-card-list" in:fly={{ y: 50 }}>
			{#each showcase as khatm (khatm.id)}
				<li animate:flip={{ duration: 300 }} transition:fly={{ x: 20 }}>
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>

		<div class="ui-card-actions justify-end">
			<button disabled={!isDirty} class="ui-btn ui-btn-primary" onclick={save}>
				{#if loading}
					<span transition:slide={{ axis: 'x' }} class="ui-spinner block"></span>
				{/if}
				ذخیره تغییرات
			</button>
		</div>
	</div>
</section>

<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">ختم‌های تأیید شده</h2>
		<ul class="ui-khatm-card-list">
			{#each lastKhatms as khatm (khatm.id)}
				<li>
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
	</div>
</section>
