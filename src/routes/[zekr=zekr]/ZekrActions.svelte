<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
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
	import * as m from '$lib/paraglide/messages.js'

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
		if (customCount === null) return toast('error', m.zekr_empty_input())
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
			<span>{m.zekr_participation_eyebrow()}</span>
			<h2 id="participation-title">
				{myCount ? m.zekr_join_again() : m.zekr_add_share()}
			</h2>
			<p>{m.zekr_participation_description()}</p>
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
				<span>{isSuccessful(count, 'quick') ? m.zekr_registered_count({ count: text }) : text}</span>
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
					{m.zekr_one_success()}
				{:else}
					{m.zekr_one_said()}
				{/if}
			</span>
		</button>

		<div class="ui-zekr-quick-actions">
			{@render quickButton(m.zekr_count_times({ count: '5' }), 5)}
			{@render quickButton(m.zekr_count_times({ count: '10' }), 10)}
			{@render quickButton(m.zekr_count_times({ count: '50' }), 50)}
			<button
				type="button"
				class="ui-btn ui-btn-outline ui-zekr-quick-button"
				disabled={loading !== -1}
				onclick={openModal}
			>
				<IconEdit />
				<span>{m.zekr_custom_count()}</span>
			</button>
		</div>
	</div>

	<div class="ui-zekr-action-status" aria-live="polite" aria-atomic="true">
		{#if loading !== -1}
			<div class="ui-alert ui-alert-info">
				<div class="ui-zekr-feedback-content">
					<span class="ui-spinner" aria-hidden="true"></span>
					<div>
						<strong>{m.zekr_registering({ count: loading.toLocaleString(localeTag()) })}</strong>
						<small>{m.zekr_wait()}</small>
					</div>
				</div>
			</div>
		{:else if pickResult?.status === 'success'}
			<div class="ui-alert ui-alert-success">
				<div class="ui-zekr-feedback-content">
					<IconCheck aria-hidden="true" />
					<div>
						<strong>{m.zekr_registered_count({ count: pickResult.count.toLocaleString(localeTag()) })}</strong>
						<small>{m.zekr_success_total({ count: myCount.toLocaleString(localeTag()) })}</small>
					</div>
				</div>
			</div>
		{:else if pickResult?.status === 'error'}
			<div class="ui-alert ui-alert-error">
				<div class="ui-zekr-feedback-content">
					<span class="ui-zekr-feedback-error" aria-hidden="true">!</span>
					<div>
						<strong>{m.zekr_participation_failed()}</strong>
						<small>{m.zekr_check_connection()}</small>
					</div>
				</div>
			</div>
		{:else}
			<span class="ui-zekr-action-hint">{m.zekr_stats_updated()}</span>
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
			aria-label={m.common_close()}
			onclick={closeModal}
		>
			<IconClose />
		</button>

		<div class="ui-zekr-modal-heading">
			<span><IconEdit /></span>
			<div>
				<small>{m.zekr_custom_participation()}</small>
				<h2 id="custom-count-title">{m.zekr_count_question()}</h2>
			</div>
		</div>

		<label class="ui-field-label" for="input-count">{m.zekr_participation_count()}</label>
		<input
			bind:value={customCount}
			class="ui-input"
			dir="ltr"
			id="input-count"
			type="number"
			inputmode="numeric"
			step="1"
			min="1"
			placeholder={m.zekr_example_100()}
			aria-describedby="custom-count-hint"
			required
			use:autoFocus
		/>
		<p id="custom-count-hint" class="ui-zekr-modal-hint">{m.zekr_positive_number()}</p>

		<button
			type="submit"
			class="ui-btn ui-btn-primary ui-btn-block ui-btn-lg"
			disabled={loading !== -1}
		>
			{#if loading !== -1}
				<span class="ui-spinner ui-spinner-md" transition:slide={{ axis: 'x' }}></span>
			{/if}
			<span>{loading !== -1 ? m.zekr_registering_short() : m.zekr_register_participation()}</span>
		</button>
	</form>
</Modal>
