<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import type { PageProps } from './$types'
	import { validateForm } from '$lib/actions/validateForm'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { toast } from '$lib/components/toast.svelte'
	import SucessResult from './sucess-result.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import RangeTypePicker from '$lib/components/RangeTypePicker.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import type { RangeType } from '$lib/contracts/domain'
	import IconBook from '~icons/ic/round-menu-book'
	import IconLock from '~icons/ic/round-lock'
	import IconPublic from '~icons/ic/round-public'
	import IconRepeat from '~icons/ic/round-autorenew'
	import IconArrow from '~icons/ic/round-arrow-back'
	import { tick } from 'svelte'
	import type { CreateKhatmResult } from '$lib/contracts/api'
	import { ApiError, apiRequest } from '$lib/utility/request'
	import * as m from '$lib/paraglide/messages.js'

	let { data }: PageProps = $props()
	let result = $state<CreateKhatmResult | null>(null)

	const initialRangeType: RangeType =
		/* svelte-ignore state_referenced_locally */ data.rangeType === 'ayah' ? 'ayah' : 'free'
	let rangeType = $state<RangeType>(initialRangeType)
	let access = $state<'public' | 'private'>('private')
	let series = $state(false)
	let title = $state('')
	let description = $state('')
	let aiWarningOpen = $state(false)
	let aiWarning = $state<{ id: string; reason: string } | null>(null)
	let forceAiReviewId = $state<string | null>(null)
	let formElement = $state<HTMLFormElement>()
	let submitting = $state(false)

	async function submitForm(event: SubmitEvent) {
		event.preventDefault()
		submitting = true
		const form = new FormData(event.currentTarget as HTMLFormElement)
		try {
			result = await apiRequest<CreateKhatmResult>('POST', '/khatm/create', {
				body: {
					title: String(form.get('title') || ''),
					description: String(form.get('description') || ''),
					rangeType: String(form.get('rangeType') || ''),
					private: form.get('access') === 'private',
					series: form.get('series') === 'on',
					force: form.get('force') === 'true',
					aiReviewId: String(form.get('aiReviewId') || ''),
				},
				origin: location.origin,
			})
		} catch (cause) {
			const response = cause instanceof ApiError ? (cause.body as CreateKhatmResult | null) : null
			if (response?.aiWarning) {
				aiWarning = response.aiWarning
				aiWarningOpen = true
			} else {
				toast(
					'error',
					response?.errorMessage || (cause instanceof Error ? cause.message : m.error_generic()),
				)
			}
		} finally {
			submitting = false
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.code === 'Enter') event.preventDefault()
	}

	async function forceCreate() {
		if (!aiWarning) return
		forceAiReviewId = aiWarning.id
		aiWarningOpen = false
		await tick()
		formElement?.requestSubmit()
	}

	function reviseContent() {
		aiWarningOpen = false
		forceAiReviewId = null
	}
</script>

<PageTitle title={m.add_title()} />

<Header title={m.add_title()} />

{#if !result?.khatm}
	<div class="ui-add-shell">
		<section class="ui-add-intro" aria-labelledby="add-intro-title">
			<div class="ui-add-intro-icon" aria-hidden="true"><IconBook /></div>
			<div>
				<p class="ui-add-eyebrow">{m.add_eyebrow()}</p>
				<h2 id="add-intro-title">{m.add_heading()}</h2>
				<p>{m.add_description()}</p>
			</div>
		</section>

		<form
			bind:this={formElement}
			use:validateForm
			novalidate
			class="ui-card ui-card-bordered ui-add-form"
			aria-busy={submitting}
			onsubmit={submitForm}
		>
			{#if forceAiReviewId}
				<input type="hidden" name="force" value="true" />
				<input type="hidden" name="aiReviewId" value={forceAiReviewId} />
			{/if}
			<div class="ui-card-body">
				<section class="ui-add-section" aria-labelledby="details-title">
					<div class="ui-add-section-heading">
						<span class="ui-add-step">۱</span>
						<div>
							<h3 id="details-title">{m.add_details_title()}</h3>
							<p>{m.add_details_hint()}</p>
						</div>
					</div>

					<div class="ui-add-fields">
						<label for="input-title" class="ui-field-label">{m.add_khatm_title()}</label>
						<input
							class="ui-input"
							type="text"
							name="title"
							bind:value={title}
							id="input-title"
							maxlength="100"
							placeholder={m.add_title_placeholder()}
							required
							onkeypress={handleKeyPress}
						/>

						<label for="input-description" class="ui-field-label">
							{m.add_description_label()} <span class="ui-add-optional">{m.add_optional()}</span>
						</label>
						<textarea
							class="ui-textarea"
							name="description"
							bind:value={description}
							id="input-description"
							maxlength="65535"
							placeholder={m.add_description_placeholder()}
						></textarea>
					</div>
				</section>

				<section class="ui-add-section" aria-labelledby="range-title">
					<div class="ui-add-section-heading">
						<span class="ui-add-step">۲</span>
						<div>
							<h3 id="range-title">{m.add_range_title()}</h3>
							<p>{m.add_range_hint()}</p>
						</div>
					</div>

					{#if data.rangeType === 'ayah'}
						<input type="hidden" name="rangeType" value="ayah" />
						<RangeTypePicker value="ayah" options={['ayah']} disabled />
					{:else}
						<RangeTypePicker bind:value={rangeType} />
					{/if}
				</section>

				<section class="ui-add-section" aria-labelledby="access-title">
					<div class="ui-add-section-heading">
						<span class="ui-add-step">۳</span>
						<div>
							<h3 id="access-title">{m.add_access_title()}</h3>
							<p>{m.add_access_hint()}</p>
						</div>
					</div>

					<div class="ui-add-choice-grid">
						<label class="ui-add-choice" data-selected={access === 'private'}>
							<input
								class="ui-radio"
								type="radio"
								name="access"
								value="private"
								bind:group={access}
							/>
							<span class="ui-add-choice-icon" aria-hidden="true"><IconLock /></span>
							<span class="ui-add-choice-copy">
								<strong>{m.add_private()}</strong>
								<small>{m.add_private_hint()}</small>
							</span>
						</label>

						<label class="ui-add-choice" data-selected={access === 'public'}>
							<input
								class="ui-radio"
								type="radio"
								name="access"
								value="public"
								bind:group={access}
							/>
							<span class="ui-add-choice-icon" aria-hidden="true"><IconPublic /></span>
							<span class="ui-add-choice-copy">
								<strong>{m.add_public()}</strong>
								<small>{m.add_public_hint()}</small>
							</span>
						</label>
					</div>

					<label class="ui-add-series" data-selected={series}>
						<input class="ui-checkbox" type="checkbox" name="series" bind:checked={series} />
						<span class="ui-add-choice-icon" aria-hidden="true"><IconRepeat /></span>
						<span class="ui-add-choice-copy">
							<strong>{m.add_serial()}</strong>
							<small>{m.add_serial_hint()}</small>
						</span>
					</label>
				</section>

				<div class="ui-add-submit">
					<p class="ui-text-muted">{m.add_submit_hint()}</p>
					<button
						class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block"
						type="submit"
						disabled={submitting}
					>
						{#if submitting}
							<span class="ui-spinner" aria-hidden="true"></span>
							<span>{m.add_creating()}</span>
						{:else}
							<span>{m.add_create()}</span>
							<IconArrow aria-hidden="true" class="ltr:mirror" />
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
{:else}
	<SucessResult khatm={Khatm.fromPlain(result.khatm)} claimToken={result.guestClaimToken} />
{/if}

<Modal bind:open={aiWarningOpen} contentClass="ui-add-ai-warning-dialog">
	{#if aiWarning}
		<section aria-labelledby="ai-warning-title">
			<h2 id="ai-warning-title">{m.add_ai_title()}</h2>
			<p>{aiWarning.reason}</p>
			<p class="ui-text-muted">{m.add_ai_description()}</p>
			<div class="ui-add-ai-warning-actions">
				<button class="ui-btn ui-btn-outline" type="button" onclick={reviseContent}
					>{m.add_edit_text()}</button
				>
				<button class="ui-btn ui-btn-primary" type="button" onclick={forceCreate}
					>{m.add_force_create()}</button
				>
			</div>
		</section>
	{/if}
</Modal>
