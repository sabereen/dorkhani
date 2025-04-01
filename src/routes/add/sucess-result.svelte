<script lang="ts">
	import { toast } from '$lib/components/TheToast.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { onMount } from 'svelte'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'

	type Props = {
		khatm: Khatm
		hash?: string | null
	}

	const { khatm, hash }: Props = $props()

	const link = $derived(khatm.getLink(hash))

	async function copy() {
		try {
			await navigator.clipboard.writeText(link)
			toast('info', 'لینک ختم قرآن شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

	async function share() {
		try {
			await khatm.share(link)
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

	onMount(() => {
		new CreatedKhatm({
			khatm: khatm.plain,
			hash: hash || null,
		}).save()
	})
</script>

<div class="alert alert-success">
	ختم «{khatm.title}» ایجاد شد.
</div>
<div class="card card-xl bg-base-200 mt-4 shadow-sm">
	<div class="card-body">
		<h2 class="card-title">{khatm.title}</h2>
		<p>{khatm.description}</p>
		<p class="text-sm" dir="ltr">
			<a href={link} class="link font-sans" target="_blank">{link}</a>
		</p>
		<div class="card-actions">
			<button class="btn btn-primary" onclick={share}>
				<IconShare class="size-5" />
				اشتراک گذاری
			</button>
			<button class="btn btn-outline" onclick={copy}>
				<IconCopy class="size-5" />
				کپی لینک
			</button>
		</div>
	</div>
</div>
