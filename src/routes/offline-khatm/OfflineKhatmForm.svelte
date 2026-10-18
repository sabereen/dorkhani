<script lang="ts">
	import RangeTypePicker from '$lib/components/RangeTypePicker.svelte'
	import type { OfflineKhatmRecord, RangeType } from '$lib/contracts/domain'
	import { offlineKhatm_create, offlineKhatm_update } from '$lib/storage/offlineKhatm'
	import * as m from '$lib/paraglide/messages.js'
	import IconBook from '~icons/ic/round-menu-book'
	import IconSave from '~icons/ic/round-save'

	type Props = {
		khatm?: OfflineKhatmRecord
		onSaved: (khatm: OfflineKhatmRecord) => void
		onCancel?: () => void
	}

	const { khatm, onSaved, onCancel }: Props = $props()
	/* svelte-ignore state_referenced_locally */
	const initialKhatm = khatm
	let title = $state(initialKhatm?.title || '')
	let description = $state(initialKhatm?.description || '')
	let rangeType = $state<RangeType>(initialKhatm?.rangeType || 'free')
	let series = $state(initialKhatm?.series || false)
	let saving = $state(false)
	let errorMessage = $state('')

	async function save(event: SubmitEvent) {
		event.preventDefault()
		if (saving) return
		saving = true
		errorMessage = ''
		try {
			const saved = khatm
				? await offlineKhatm_update(khatm.id, { title, description, rangeType })
				: await offlineKhatm_create({ title, description, rangeType, series })
			onSaved(saved)
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : m.offline_save_error()
		} finally {
			saving = false
		}
	}
</script>

<form class="ui-card ui-card-bordered ui-offline-form" onsubmit={save} aria-busy={saving}>
	<div class="ui-card-body">
		<header class="ui-offline-form-heading">
			<span class="ui-offline-form-icon"><IconBook /></span>
			<div>
				<h2>{khatm ? m.offline_edit_title() : m.offline_create_title()}</h2>
				<p>{m.offline_khatm_device_only()} {m.offline_not_shareable()}</p>
			</div>
		</header>

		{#if errorMessage}
			<div class="ui-alert ui-alert-error" role="alert">{errorMessage}</div>
		{/if}

		<div class="ui-offline-fields">
			<label class="ui-field-label" for="offline-khatm-title">{m.offline_title_label()}</label>
			<input
				id="offline-khatm-title"
				class="ui-input"
				name="title"
				maxlength="100"
				required
				bind:value={title}
				placeholder={m.offline_title_placeholder()}
			/>

			<label class="ui-field-label" for="offline-khatm-description"
				>{m.offline_description_label()}</label
			>
			<textarea
				id="offline-khatm-description"
				class="ui-textarea"
				name="description"
				maxlength="65535"
				bind:value={description}
			></textarea>
		</div>

		<fieldset class="ui-fieldset">
			<legend class="ui-fieldset-legend">{m.offline_division()}</legend>
			<RangeTypePicker bind:value={rangeType} disabled={Boolean(khatm?.versesRead)} />
			{#if khatm?.versesRead}
				<p class="ui-text-muted">{m.offline_range_locked()}</p>
			{/if}
		</fieldset>

		{#if !khatm}
			<label class="ui-offline-series" data-selected={series}>
				<input class="ui-checkbox" type="checkbox" bind:checked={series} />
				<span><strong>{m.offline_serial()}</strong><small>{m.offline_serial_hint()}</small></span>
			</label>
		{/if}

		<div class="ui-offline-form-actions">
			{#if onCancel}
				<button class="ui-btn ui-btn-ghost" type="button" onclick={onCancel}
					>{m.offline_cancel()}</button
				>
			{/if}
			<button class="ui-btn ui-btn-primary" type="submit" disabled={saving}>
				{#if saving}<span class="ui-spinner"></span>{:else}<IconSave />{/if}
				{saving ? m.offline_saving() : khatm ? m.offline_save_changes() : m.offline_khatm_create()}
			</button>
		</div>
	</div>
</form>
