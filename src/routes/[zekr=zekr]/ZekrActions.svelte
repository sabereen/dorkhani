<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { slide } from 'svelte/transition'
	import { toast } from '$lib/components/TheToast.svelte'
	import { wait } from '$lib/utility/wait'
	import type { Zekr } from '$lib/entity/Zekr.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import { validateForm } from '$lib/actions/validateForm'
	import Modal from '$lib/components/Modal.svelte'
	import type { Action } from 'svelte/action'
	import IconAdd from '~icons/ic/round-add'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconClose from '~icons/ic/round-close'
	import IconEdit from '~icons/ic/round-edit'
	import IconVolunteer from '~icons/ic/round-volunteer-activism'

	type Props = {
		zekr: Zekr
		myCount?: number
	}

	type PageState = {
		modal?: boolean
	}

	type PickResult = {
		status: 'success' | 'error'
		count: number
		source: 'primary' | 'quick' | 'custom'
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
		const isOk = await pick(customCount, 'custom')
		if (isOk) {
			closeModal()
			customCount = null
		}
	}

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد ذکر را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد ذکرش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)
	let pickResult = $state<PickResult | null>(null)

	function isSuccessful(count: number, source: PickResult['source']) {
		return (
			loading === -1 &&
			pickResult?.status === 'success' &&
			pickResult.count === count &&
			pickResult.source === source
		)
	}

	async function pick(count: number, source: PickResult['source']) {
		if (loading !== -1) return

		pickResult = null
		loading = count

		const waitPromise = wait(1500)

		try {
			await zekr.pick({ count })
			myCount += count
			pickResult = { status: 'success', count, source }
			return true
		} catch (err) {
			console.error(err)
			pickResult = { status: 'error', count, source }
			toast('error', (err as { message?: string })?.message || String(err))
			return false
		} finally {
			// برای اینکه بین دو کلیک متوالی مدتی فاصله باشد
			// که کاربر اشتباهی چند مرتبه روی دکمه کلیک نکند
			await waitPromise
			loading = -1
		}
	}
</script>

<section
	class="ui-zekr-participation"
	aria-labelledby="participation-title"
	aria-busy={loading !== -1}
>
	<div class="ui-zekr-participation-heading">
		<span class="ui-zekr-participation-icon"><IconVolunteer /></span>
		<div>
			<span>ثبت همراهی</span>
			<h2 id="participation-title">
				{myCount ? 'دوباره در این ختم سهیم شوید' : 'سهم خود را به این ختم اضافه کنید'}
			</h2>
			<p>تعداد ذکری را که خوانده‌اید انتخاب کنید؛ مشارکت شما همان لحظه ثبت می‌شود.</p>
		</div>
	</div>

	<div class="ui-zekr-action-grid">
		{#snippet quickButton(text: string, count: number)}
			<button
				type="button"
				class="ui-btn ui-btn-soft ui-zekr-quick-button"
				class:ui-zekr-action-complete={isSuccessful(count, 'quick')}
				disabled={loading !== -1}
				onclick={() => pick(count, 'quick')}
			>
				{#if loading === count}
					<span class="ui-spinner" transition:slide={{ axis: 'x' }}></span>
				{:else if isSuccessful(count, 'quick')}
					<IconCheck />
				{:else}
					<IconAdd />
				{/if}
				<span>{isSuccessful(count, 'quick') ? `${text} ثبت شد` : text}</span>
			</button>
		{/snippet}

		<button
			type="button"
			class="ui-btn ui-btn-primary ui-btn-xl ui-zekr-primary-action"
			class:ui-zekr-action-complete={isSuccessful(1, 'primary')}
			disabled={loading !== -1}
			onclick={() => pick(1, 'primary')}
		>
			{#if loading === 1}
				<span class="ui-spinner ui-spinner-md" transition:slide={{ axis: 'x' }}></span>
			{:else if isSuccessful(1, 'primary')}
				<IconCheck />
			{:else}
				<IconVolunteer />
			{/if}
			<span>
				{#if isSuccessful(1, 'primary')}
					یک مرتبه با موفقیت ثبت شد
				{:else}
					یک مرتبه ذکر گفتم
				{/if}
			</span>
		</button>

		<div class="ui-zekr-quick-actions">
			{@render quickButton('۵ مرتبه', 5)}
			{@render quickButton('۱۰ مرتبه', 10)}
			{@render quickButton('۵۰ مرتبه', 50)}
			<button
				type="button"
				class="ui-btn ui-btn-outline ui-zekr-quick-button"
				disabled={loading !== -1}
				onclick={openModal}
			>
				<IconEdit />
				<span>تعداد دلخواه</span>
			</button>
		</div>
	</div>

	<div class="ui-zekr-action-status" aria-live="polite" aria-atomic="true">
		{#if loading !== -1}
			<div class="ui-alert ui-alert-info">
				<div class="ui-zekr-feedback-content">
					<span class="ui-spinner" aria-hidden="true"></span>
					<div>
						<strong>در حال ثبت {loading.toLocaleString('fa')} مرتبه ذکر…</strong>
						<small>لطفاً چند لحظه صبر کنید.</small>
					</div>
				</div>
			</div>
		{:else if pickResult?.status === 'success'}
			<div class="ui-alert ui-alert-success">
				<div class="ui-zekr-feedback-content">
					<IconCheck aria-hidden="true" />
					<div>
						<strong>{pickResult.count.toLocaleString('fa')} مرتبه با موفقیت ثبت شد</strong>
						<small>مجموع مشارکت شما: {myCount.toLocaleString('fa')} مرتبه</small>
					</div>
				</div>
			</div>
		{:else if pickResult?.status === 'error'}
			<div class="ui-alert ui-alert-error">
				<div class="ui-zekr-feedback-content">
					<span class="ui-zekr-feedback-error" aria-hidden="true">!</span>
					<div>
						<strong>ثبت مشارکت انجام نشد</strong>
						<small>اتصال خود را بررسی و دوباره تلاش کنید.</small>
					</div>
				</div>
			</div>
		{:else}
			<span class="ui-zekr-action-hint">با ثبت هر مشارکت، آمار بالای صفحه به‌روز می‌شود.</span>
		{/if}
	</div>
</section>

<Modal bind:open={() => modalCustomCount, toggleModal} contentClass="ui-zekr-modal">
	<form
		class="ui-zekr-modal-form"
		use:validateForm
		novalidate
		action=""
		onsubmit={handleModalAction}
		aria-labelledby="custom-count-title"
	>
		<button
			type="button"
			class="ui-btn ui-btn-icon ui-btn-sm ui-btn-ghost ui-zekr-modal-close"
			aria-label="بستن پنجره"
			onclick={closeModal}
		>
			<IconClose />
		</button>

		<div class="ui-zekr-modal-heading">
			<span><IconEdit /></span>
			<div>
				<small>مشارکت با تعداد دلخواه</small>
				<h2 id="custom-count-title">چند مرتبه ذکر گفته‌اید؟</h2>
			</div>
		</div>

		<label class="ui-field-label" for="input-count">تعداد مشارکت</label>
		<input
			bind:value={customCount}
			class="ui-input"
			dir="ltr"
			id="input-count"
			type="number"
			inputmode="numeric"
			step="1"
			min="1"
			placeholder="مثلاً ۱۰۰"
			aria-describedby="custom-count-hint"
			required
			use:autoFocus
		/>
		<p id="custom-count-hint" class="ui-zekr-modal-hint">یک عدد بزرگ‌تر از صفر وارد کنید.</p>

		<button
			type="submit"
			class="ui-btn ui-btn-primary ui-btn-block ui-btn-lg"
			disabled={loading !== -1}
		>
			{#if loading !== -1}
				<span class="ui-spinner ui-spinner-md" transition:slide={{ axis: 'x' }}></span>
			{/if}
			<span>{loading !== -1 ? 'در حال ثبت…' : 'ثبت مشارکت'}</span>
		</button>
	</form>
</Modal>
