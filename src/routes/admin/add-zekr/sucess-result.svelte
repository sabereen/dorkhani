<script lang="ts">
	import { browser } from '$app/environment'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import type { Zekr } from '$lib/entity/Zekr.svelte'
	import { idb_localZekr_add } from '$lib/idb/localZekr'
	import { onMount } from 'svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconOpen from '~icons/ic/round-open-in-new'
	import IconShare from '~icons/ic/outline-share'

	type Props = {
		zekr: Zekr
	}

	const { zekr }: Props = $props()
	const canShare = !browser || Boolean(navigator.share)

	async function copy() {
		try {
			await zekr.copy()
			toast('info', 'لینک ختم ذکر شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی لینک. دوباره تلاش کنید.')
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

<section class="ui-admin-success" aria-labelledby="zekr-success-title">
	<div class="ui-admin-success-mark" aria-hidden="true"><IconCheck /></div>
	<span class="ui-admin-eyebrow">ساخت با موفقیت انجام شد</span>
	<h1 id="zekr-success-title">ختم «{zekr.title}» آماده است</h1>
	<p>اکنون می‌توانید لینک زیر را باز کنید یا برای مشارکت دیگران به اشتراک بگذارید.</p>

	<div class="ui-admin-success-card">
		<div class="ui-admin-success-card-heading">
			<div>
				<span>ختم ذکر ایجادشده</span>
				<h2>{zekr.title}</h2>
			</div>
			<span class="ui-badge ui-badge-success">فعال</span>
		</div>

		{#if zekr.description}
			<div dir="auto" class="ui-admin-success-description whitespace-pre-wrap break-words">
				<ExpandableText text={zekr.description} maxLength={250} />
			</div>
		{/if}

		<div class="ui-admin-link-box">
			<span>لینک اختصاصی</span>
			<a href={zekr.link} class="ui-link" target="_blank" rel="noreferrer" dir="ltr">
				{zekr.link}
			</a>
		</div>

		<div class="ui-admin-success-actions">
			<a href={zekr.link} class="ui-btn ui-btn-outline" target="_blank" rel="noreferrer">
				<IconOpen />
				باز کردن ختم
			</a>
			<button class="ui-btn ui-btn-soft" type="button" onclick={copy}>
				<IconCopy />
				کپی لینک
			</button>
			{#if canShare}
				<button class="ui-btn ui-btn-primary" type="button" onclick={share}>
					<IconShare />
					اشتراک‌گذاری
				</button>
			{/if}
		</div>
	</div>
</section>
