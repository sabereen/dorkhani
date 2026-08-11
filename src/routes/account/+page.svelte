<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { authClient } from '$lib/auth-client'
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
	const khatms = $derived(Khatm.fromPlainList(data.khatms))

	async function signOut() {
		await authClient.signOut()
		await invalidateAll()
		await goto(`${base}/`)
	}
</script>

<svelte:head><title>حساب من | ختم قرآن</title></svelte:head>

<Header title="حساب من" />

<section class="ui-card ui-card-bordered mt-4">
	<div class="ui-card-body flex-row items-center justify-between">
		<div>
			<h2 class="font-bold">{data.user.name}</h2>
			{#if data.user.email}<p class="text-sm opacity-70">{data.user.email}</p>{/if}
		</div>
		<button class="ui-btn ui-btn-outline" type="button" onclick={signOut}>خروج</button>
	</div>
</section>

<section class="mt-6">
	<h2 class="mb-3 text-xl font-black">ختم‌های من</h2>
	{#if khatms.length === 0}
		<div class="ui-alert">هنوز ختمی به این حساب متصل نشده است.</div>
	{:else}
		<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
			{#each khatms as khatm (khatm.id)}
				<li>
					<KhatmListCard {khatm} meta={khatm.private ? 'ختم خصوصی' : 'ختم عمومی'}>
						{#snippet actions()}
							<a class="ui-btn ui-btn-ghost ui-btn-xs" href={khatm.link}>مشاهده</a>
							<a
								class="ui-btn ui-btn-primary ui-btn-xs"
								href={`${base}/account/khatms/${khatm.id}/edit`}>ویرایش</a
							>
						{/snippet}
					</KhatmListCard>
				</li>
			{/each}
		</ul>
	{/if}
</section>
