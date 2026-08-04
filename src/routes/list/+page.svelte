<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import Header from '$lib/components/Header.svelte'
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

<section class="card card-border bg-base-200 mt-4">
	<div class="card-body">
		<ul class="list">
			{#each khatms as khatm (khatm.id)}
				<li class="">
					<a
						class="list-row clear-both !block !flex w-full hover:bg-green-500/15"
						href={khatm.link}
					>
						<!-- Title & Badge -->
						<span class="min-w-0 grow">
							{khatm.title}
							{#if !khatm.isFree}
								<span class="badge badge-xs" class:badge-info={khatm.isAyahOriented}>
									{khatm.rangeTypeTitle}
								</span>
							{/if}
						</span>
						<!-- Percent -->
						<span class="flex shrink-0 flex-col items-end">
							<span class="-mt-1 px-0.5 text-[13px]">
								{khatm.percent.toLocaleString('fa')}%
							</span>
							<progress class="progress progress-success h-1.5 w-10" max={100} value={khatm.percent}
							></progress>
						</span>
					</a>
				</li>
			{/each}
		</ul>
		{#if !lastPage}
			<button class="btn" onclick={nextPage} disabled={loading}> بارگیری موارد بعدی </button>
		{/if}
	</div>
</section>
