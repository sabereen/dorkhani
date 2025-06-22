<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { slide } from 'svelte/transition'
	import { toast } from '$lib/components/TheToast.svelte'
	import { wait } from '$lib/utility/wait'
	import type { Zekr } from '$lib/entity/Zekr.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import Modal from '$lib/components/Modal.svelte'
	import type { Action } from 'svelte/action'
	import IconClose from '~icons/ic/round-close'

	type Props = {
		zekr: Zekr
		myCount?: number
	}

	type PageState = {
		modal?: boolean
	}

	let { zekr, myCount = $bindable(0) }: Props = $props()

	const autoFocus: Action<HTMLInputElement> = (element) => {
		element.focus()
	}

	let customCount = $state<number | null>(null)
	const modalCustomCount = $derived(!!(page.state as PageState).modal)
	function openModal() {
		if (modalCustomCount) return
		pushState('', {
			modal: true,
		})
	}
	function closeModal() {
		if (!modalCustomCount) return
		customCount = null
		history.back()
	}
	function toggleModal(open = !modalCustomCount) {
		if (open) openModal()
		else closeModal()
	}

	async function handleModalAction(event: Event) {
		event.preventDefault()
		if (customCount === null) return toast('error', 'ورودی خالی است.')
		const isOk = await pick(customCount)
		if (isOk) {
			closeModal()
			customCount = null
		}
	}

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد آیات را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد آیاتش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)

	async function pick(count = 1) {
		if (loading !== -1) return

		loading = count

		const waitPromise = wait(1500)

		try {
			await zekr.pick({ count })
			myCount += count
			return true
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
			return false
		} finally {
			// برای اینکه بین دو کلیک متوالی مدتی فاصله باشد
			// که کاربر اشتباهی چند مرتبه روی دکمه کلیک نکند
			await waitPromise
			loading = -1
		}
	}
</script>

<div class="mt-5 flex flex-col text-center">
	<p class="text-balance px-4 text-lg">
		{#if myCount}
			شما چه تعداد دیگر می‌خواهید مشارکت کنید؟
		{:else}
			شما چه تعداد مشارکت می‌کنید؟
		{/if}
	</p>
	<div class="mt-5 px-4">
		<div class="grid grid-cols-2 gap-2">
			{#snippet smallButton(text: string, count: number, action?: () => void)}
				<button class="btn btn-outline btn-sm" onclick={action || (() => pick(count))}>
					{#if loading === count}
						<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
					{/if}
					{text}
				</button>
			{/snippet}

			<button
				class="btn btn-primary btn-xl col-span-2 h-[3.3rem] text-xl font-bold"
				onclick={() => pick(1)}
			>
				{#if loading === 1}
					<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
				{/if}
				یک عدد
			</button>

			{@render smallButton('۵ عدد', 5)}
			{@render smallButton('۱۰ عدد', 10)}
			{@render smallButton('۵۰ عدد', 50)}
			{@render smallButton('تعداد دلخواه', 0, openModal)}
		</div>
	</div>
</div>

<Modal bind:open={() => modalCustomCount, toggleModal}>
	<form action="" onsubmit={handleModalAction}>
		<button
			type="button"
			class="btn !btn-circle btn-sm btn-ghost absolute left-3 top-3"
			aria-label="Settings"
			onclick={closeModal}
		>
			<IconClose class="size-5" />
		</button>
		<label for="input-count">چه تعداد قبول می‌کنید؟</label>
		<div class="mt-1">
			<input
				bind:value={customCount}
				class="input input-success"
				dir="ltr"
				id="input-count"
				type="number"
				step="1"
				use:autoFocus
			/>
		</div>
		<div class="mt-3">
			<button type="submit" class="btn btn-primary btn-block">
				{#if loading !== -1}
					<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
				{/if}
				تأیید
			</button>
		</div>
	</form>
</Modal>
