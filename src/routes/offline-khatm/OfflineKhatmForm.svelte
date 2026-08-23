<script lang="ts">
	import RangeTypePicker from '$lib/components/RangeTypePicker.svelte'
	import type { OfflineKhatmRecord, RangeType } from '$lib/contracts/domain'
	import {
		idb_offlineKhatm_create,
		idb_offlineKhatm_update,
	} from '$lib/idb/offlineKhatm'
	import * as m from '$lib/paraglide/messages.js'
	import IconBook from '~icons/ic/round-menu-book'
	import IconSave from '~icons/ic/round-save'

	type Props = {
		khatm?: OfflineKhatmRecord
		onSaved: (khatm: OfflineKhatmRecord) => void
		onCancel?: () => void
	}

	const { khatm, onSaved, onCancel }: Props = $props()
	let title = $state(khatm?.title || '')
	let description = $state(khatm?.description || '')
	let rangeType = $state<RangeType>(khatm?.rangeType || 'free')
	let series = $state(khatm?.series || false)
	let saving = $state(false)
	let errorMessage = $state('')

	async function save(event: SubmitEvent) {
		event.preventDefault()
		if (saving) return
		saving = true
		errorMessage = ''
		try {
			const saved = khatm
				? await idb_offlineKhatm_update(khatm.id, { title, description, rangeType })
				: await idb_offlineKhatm_create({ title, description, rangeType, series })
			onSaved(saved)
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : m.offline_save_error()
		} finally {
			saving = false
		}
	}
</script>

<form class="ui-card ui-card-bordered offline-form" onsubmit={save} aria-busy={saving}>
	<div class="ui-card-body">
		<header class="offline-form-heading">
			<span class="offline-form-icon"><IconBook /></span>
			<div>
				<h2>{khatm ? m.offline_edit_title() : m.offline_create_title()}</h2>
				<p>{m.offline_khatm_device_only()} {m.offline_not_shareable()}</p>
			</div>
		</header>

		{#if errorMessage}
			<div class="ui-alert ui-alert-error" role="alert">{errorMessage}</div>
		{/if}

		<div class="offline-fields">
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

		<label class="ui-field-label" for="offline-khatm-description">{m.offline_description_label()}</label>
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
			<label class="offline-series" data-selected={series}>
				<input class="ui-checkbox" type="checkbox" bind:checked={series} />
				<span><strong>{m.offline_serial()}</strong><small>{m.offline_serial_hint()}</small></span>
			</label>
		{/if}

		<div class="offline-form-actions">
			{#if onCancel}
				<button class="ui-btn ui-btn-ghost" type="button" onclick={onCancel}>{m.offline_cancel()}</button>
			{/if}
			<button class="ui-btn ui-btn-primary" type="submit" disabled={saving}>
				{#if saving}<span class="ui-spinner"></span>{:else}<IconSave />{/if}
				{saving ? m.offline_saving() : khatm ? m.offline_save_changes() : m.offline_khatm_create()}
			</button>
		</div>
	</div>
</form>

<style>
	.offline-form {
		background: var(--ui-color-surface-raised);
	}

	.offline-form-heading,
	.offline-series,
	.offline-form-actions {
		display: flex;
		align-items: center;
	}

	.offline-form-heading > * + *,
	.offline-series > * + *,
	.offline-form-actions > * + * {
		margin-inline-start: 0.75rem;
	}

	.offline-form-heading h2,
	.offline-form-heading p {
		margin: 0;
	}

	.offline-form-heading p {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.8rem;
	}

	.offline-form-icon {
		display: flex;
		width: 3rem;
		height: 3rem;
		flex: 0 0 3rem;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		font-size: 1.5rem;
	}

	.offline-fields {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 0.4rem;
	}

	.offline-fields,
	.offline-form :global(.ui-fieldset),
	.offline-series,
	.offline-form-actions {
		margin-top: 1rem;
	}

	.offline-series {
		padding: 0.85rem;
		border: 1px solid var(--ui-color-control-border);
		border-radius: var(--ui-radius-md);
		background: var(--ui-color-control-surface);
		cursor: pointer;
	}

	.offline-series[data-selected='true'] {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
	}

	.offline-series span,
	.offline-series small {
		display: block;
	}

	.offline-series small {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
	}

	.offline-form-actions {
		justify-content: flex-end;
	}
</style>
