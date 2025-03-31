<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { page } from '$app/state'
	import { toast } from '$lib/components/TheToast.svelte'
	import { PickedKhatmPart } from '$lib/entity/PickedKhatmPart'
	import type { QuranRange } from '$lib/entity/Range'
	import type { Khatm } from '@prisma/client'

	type Props = {
		range: QuranRange | null
		khatm: Khatm
		onClose?: () => void
		onFinished?: () => void
	}

	let { range, khatm, onClose, onFinished }: Props = $props()

	let loading = $state(false)
	/** قسمت انتخاب شده را به عنوان خوانده شده علامت می‌زند */
	async function markAsRead() {
		if (loading || !range) return
		loading = true
		try {
			const response = await fetch(`/khatm/${khatm.id}`, {
				method: 'POST',
				body: JSON.stringify({
					start: range.start,
					end: range.end,
					token: page.url.searchParams.get('token'),
				}),
			})
			if (response.status !== 200) throw new Error('خطا')
			await response.json()

			new PickedKhatmPart({
				id: undefined as unknown as number,
				date: new Date(),
				start: range.start,
				end: range.end,
				khatm,
			}).save()

			invalidateAll()
			onFinished?.()
			onClose?.()
		} catch (err) {
			toast('error', String(err))
			invalidateAll()
		} finally {
			loading = false
		}
	}
</script>

{#if range}
	آیا قرائت این بازه را تقبل می‌کنید؟
	<p class="my-2 text-sm">
		{range.getTitle()}
		<a
			href={`https://ketabmobin.com/ayah/${range.start}`}
			target="_blank"
			class="badge badge-info badge-outline"
		>
			مشاهده آیات
		</a>
	</p>

	<div>
		<button class="btn btn-primary mt-2" disabled={loading} onclick={markAsRead}>می‌پذیرم</button>
		<button class="btn btn-error mt-2" disabled={loading} onclick={onClose}>لغو</button>
	</div>
{:else}
	<p class="text-lg">این بازه قبلا قرائت شده است.</p>
{/if}
