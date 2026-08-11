<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()

	let khatms = $state(Khatm.fromPlainList(/* svelte-ignore state_referenced_locally */ data.list))

	let lastPage = $state(false)
	let loading = $state(false)
	async function nextPage() {
		loading = true
		try {
			const list = await Khatm.getList({ pageID: khatms.at(-1)?.id })
			if (list.length === 0) lastPage = true
			khatms = [...khatms, ...list]
		} catch (err) {
			console.error(err)
			alert(err)
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>ختم قرآن | ختم‌های ثبت شده</title>
</svelte:head>

<Header title="ختم‌های ثبت شده" />

<section class="ui-khatm-collection mt-4">
	<header class="ui-khatm-collection-header">
		<div>
			<h2>ختم‌های عمومی</h2>
			<p>یک ختم را انتخاب کنید و سهم خود را برای قرائت بردارید.</p>
		</div>
	</header>

	<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
		{#each khatms as khatm (khatm.id)}
			<li>
				<KhatmListCard {khatm} meta="آماده برای مشارکت شما" />
			</li>
		{/each}
	</ul>
	{#if !lastPage}
		<div class="ui-khatm-collection-footer">
			<button class="ui-btn ui-btn-soft ui-btn-sm" onclick={nextPage} disabled={loading}>
				{loading ? 'در حال بارگیری…' : 'نمایش موارد بیشتر'}
			</button>
		</div>
	{/if}
</section>
