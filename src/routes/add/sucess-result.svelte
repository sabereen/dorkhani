<script lang="ts">
	import { toast } from '$lib/components/TheToast.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { onMount } from 'svelte'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'

	type Props = {
		khatm: Khatm
	}

	const { khatm }: Props = $props()

	async function copy() {
		try {
			await navigator.clipboard.writeText(khatm.link)
			toast('info', 'لینک ختم قرآن شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', String(err))
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

<div class="alert alert-success">
	ختم «{khatm.title}» ایجاد شد.
</div>
<div class="card card-xl bg-base-200 mt-4 shadow-sm">
	<div class="card-body">
		<h2 class="card-title">{khatm.title}</h2>
		<p>{khatm.description}</p>
		<p class="text-sm" dir="ltr">
			<a href={khatm.link} class="link font-sans" target="_blank">{khatm.link}</a>
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
