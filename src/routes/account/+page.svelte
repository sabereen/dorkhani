<script lang="ts">
	import Header from '$lib/components/Header.svelte'
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
		<div class="grid gap-3">
			{#each khatms as khatm}
				<article class="ui-card ui-card-bordered">
					<div class="ui-card-body">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<h3 class="break-words font-bold">{khatm.title}</h3>
								<p class="text-sm opacity-70">{khatm.rangeTypeTitle} · {khatm.private ? 'خصوصی' : 'عمومی'}</p>
							</div>
							<div class="flex shrink-0 gap-2">
								<a class="ui-btn ui-btn-ghost" href={khatm.link}>مشاهده</a>
								<a class="ui-btn ui-btn-primary" href={`${base}/account/khatms/${khatm.id}/edit`}>ویرایش</a>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
