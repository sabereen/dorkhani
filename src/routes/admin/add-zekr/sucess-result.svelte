<script lang="ts">
	import { browser } from '$app/environment'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import type { Zekr } from '$lib/entity/Zekr.svelte'
	import { idb_localZekr_add } from '$lib/idb/localZekr'
	import { onMount } from 'svelte'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'
	import IconOpen from '~icons/ic/round-open-in-new'

	type Props = {
		zekr: Zekr
	}

	const { zekr }: Props = $props()

	const canShare = !browser || navigator.share

	async function copy() {
		try {
			await zekr.copy()
			toast('info', 'لینک ختم ذکر شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی.')
		}
	}

	async function share() {
		try {
			await zekr.share()
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

	onMount(() => {
		idb_localZekr_add({
			isMine: true,
			myCount: 0,
			zekr: zekr.plain,
		})
	})
</script>

<div class="alert alert-success">
	ختم ذکر «{zekr.title}» ایجاد شد.
</div>
<div class="card card-xl bg-base-200 mt-4 shadow-sm">
	<div class="card-body">
		<h2 class="card-title">{zekr.title}</h2>
		{#if zekr.description}
			<div dir="auto" class="whitespace-pre-wrap break-words">
				<ExpandableText text={zekr.description} maxLength={250} />
			</div>
		{/if}
		<p class="text-sm" dir="ltr">
			<a href={zekr.link} class="link font-sans" target="_blank">
				{zekr.link}
			</a>
			<a href={zekr.link} class="btn !btn-outline btn-xs vertical-middle" dir="auto">
				<IconOpen class="size-4" />
				باز کردن
			</a>
		</p>
		<div class="card-actions">
			{#if canShare}
				<button class="btn btn-primary" onclick={share}>
					<IconShare class="size-5" />
					اشتراک گذاری
				</button>
			{/if}
			<button class="btn btn-outline" onclick={copy}>
				<IconCopy class="size-5" />
				کپی لینک
			</button>
		</div>
	</div>
</div>
