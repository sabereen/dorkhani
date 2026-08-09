<script lang="ts">
	import { browser } from '$app/environment'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { onMount } from 'svelte'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'
	import IconOpen from '~icons/ic/round-open-in-new'

	type Props = {
		khatm: Khatm
	}

	const { khatm }: Props = $props()

	const canShare = !browser || navigator.share

	async function copy() {
		try {
			await khatm.copy()
			toast('info', 'لینک ختم قرآن شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی.')
		}
	}

	async function share() {
		try {
			await khatm.share()
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

	onMount(() => {
		new CreatedKhatm({
			khatm: khatm.plain,
		}).save()
	})
</script>

	<div class="ui-alert ui-alert-success">
	ختم «{khatm.title}» ایجاد شد.
</div>
	<div class="ui-card ui-card-bordered ui-bg-muted mt-4">
		<div class="ui-card-body">
			<h2 class="ui-card-title">{khatm.title}</h2>
		{#if khatm.description}
			<div dir="auto" class="whitespace-pre-wrap break-words">
				<ExpandableText text={khatm.description} maxLength={250} />
			</div>
		{/if}
		<p class="text-sm" dir="ltr">
			<a href={khatm.link} class="link font-sans" target="_blank">
				{khatm.link}
			</a>
				<a href={khatm.link} class="ui-btn ui-btn-outline ui-btn-xs vertical-middle" dir="auto">
				<IconOpen class="size-4" />
				باز کردن
			</a>
		</p>
			<div class="ui-card-actions">
			{#if canShare}
				<button class="ui-btn ui-btn-primary" onclick={share}>
					<IconShare class="size-5" />
					اشتراک گذاری
				</button>
			{/if}
				<button class="ui-btn ui-btn-outline" onclick={copy}>
				<IconCopy class="size-5" />
				کپی لینک
			</button>
		</div>
	</div>
</div>
