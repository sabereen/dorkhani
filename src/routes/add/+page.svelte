<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import { validateForm } from '$lib/actions/validateForm'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import SucessResult from './sucess-result.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import RangeTypePicker from '$lib/components/RangeTypePicker.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import type { RangeType } from '@prisma-client'
	import IconBook from '~icons/ic/round-menu-book'
	import IconLock from '~icons/ic/round-lock'
	import IconPublic from '~icons/ic/round-public'
	import IconRepeat from '~icons/ic/round-autorenew'
	import IconArrow from '~icons/ic/round-arrow-back'
	import type { SubmitFunction } from '@sveltejs/kit'
	import { tick } from 'svelte'

	let { data, form }: PageProps = $props()

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

	const enhanceForm: SubmitFunction = () => {
		submitting = true
		return async ({ update }) => {
			try {
				await update()
			} finally {
				submitting = false
			}
		}
	}

	$effect(() => {
		if (form?.errorMessage) toast('error', form.errorMessage)
		if (form?.aiWarning) {
			aiWarning = form.aiWarning
			aiWarningOpen = true
		}
	})

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

<svelte:head>
	<title>ختم قرآن | ایجاد ختم گروهی جدید</title>
</svelte:head>

<Header title="ایجاد ختم گروهی جدید" />

{#if !form || !form.khatm}
	<div class="add-shell">
		<section class="add-intro" aria-labelledby="add-intro-title">
			<div class="add-intro-icon" aria-hidden="true"><IconBook /></div>
			<div>
				<p class="add-eyebrow">یک نیت، یک همراهی جمعی</p>
				<h2 id="add-intro-title">ختم تازه‌تان را بسازید</h2>
				<p>مشخصات و شیوهٔ تقسیم را انتخاب کنید؛ لینک دعوت بلافاصله آماده می‌شود.</p>
			</div>
		</section>

		<form
			bind:this={formElement}
			use:validateForm
			use:enhance={enhanceForm}
			novalidate
			class="ui-card ui-card-bordered add-form"
			aria-busy={submitting}
			action=""
			method="POST"
		>
			{#if forceAiReviewId}
				<input type="hidden" name="force" value="true" />
				<input type="hidden" name="aiReviewId" value={forceAiReviewId} />
			{/if}
			<div class="ui-card-body">
				<section class="add-section" aria-labelledby="details-title">
					<div class="add-section-heading">
						<span class="add-step">۱</span>
						<div>
							<h3 id="details-title">مشخصات ختم</h3>
							<p>یک عنوان کوتاه و به‌یادماندنی انتخاب کنید.</p>
						</div>
					</div>

					<div class="add-fields">
						<label for="input-title" class="ui-field-label">عنوان ختم</label>
						<input
							class="ui-input"
							type="text"
							name="title"
							bind:value={title}
							id="input-title"
							maxlength="100"
							placeholder="مثلاً ختم قرآن برای سلامتی خانواده"
							required
							onkeypress={handleKeyPress}
						/>

						<label for="input-description" class="ui-field-label">
							توضیحات <span class="add-optional">اختیاری</span>
						</label>
						<textarea
							class="ui-textarea"
							name="description"
							bind:value={description}
							id="input-description"
							maxlength="65535"
							placeholder="نیت ختم یا توضیح کوتاهی برای همراهان بنویسید…"
						></textarea>
					</div>
				</section>

				<section class="add-section" aria-labelledby="range-title">
					<div class="add-section-heading">
						<span class="add-step">۲</span>
						<div>
							<h3 id="range-title">نحوهٔ تقسیم قرائت</h3>
							<p>اندازهٔ سهم هر مشارکت‌کننده را مشخص کنید.</p>
						</div>
					</div>

					{#if data.rangeType === 'ayah'}
						<input type="hidden" name="rangeType" value="ayah" />
						<RangeTypePicker value="ayah" options={['ayah']} disabled />
					{:else}
						<RangeTypePicker bind:value={rangeType} />
					{/if}
				</section>

				<section class="add-section" aria-labelledby="access-title">
					<div class="add-section-heading">
						<span class="add-step">۳</span>
						<div>
							<h3 id="access-title">دسترسی و تکرار</h3>
							<p>مشخص کنید چه کسانی ختم را پیدا کنند و بعد از پایان چه اتفاقی بیفتد.</p>
						</div>
					</div>

					<div class="add-choice-grid">
						<label class="add-choice" data-selected={access === 'private'}>
							<input
								class="ui-radio"
								type="radio"
								name="access"
								value="private"
								bind:group={access}
							/>
							<span class="add-choice-icon" aria-hidden="true"><IconLock /></span>
							<span class="add-choice-copy">
								<strong>خصوصی</strong>
								<small>فقط کسانی که لینک را دارند به ختم دسترسی خواهند داشت.</small>
							</span>
						</label>

						<label class="add-choice" data-selected={access === 'public'}>
							<input
								class="ui-radio"
								type="radio"
								name="access"
								value="public"
								bind:group={access}
							/>
							<span class="add-choice-icon" aria-hidden="true"><IconPublic /></span>
							<span class="add-choice-copy">
								<strong>عمومی</strong>
								<small>پس از تأیید مدیر، امکان نمایش ختم در صفحهٔ اصلی وجود دارد.</small>
							</span>
						</label>
					</div>

					<label class="add-series" data-selected={series}>
						<input class="ui-checkbox" type="checkbox" name="series" bind:checked={series} />
						<span class="add-choice-icon" aria-hidden="true"><IconRepeat /></span>
						<span class="add-choice-copy">
							<strong>ختم پیوسته باشد</strong>
							<small>پس از پایان هر دور، دور تازه‌ای به‌صورت خودکار آغاز می‌شود.</small>
						</span>
					</label>
				</section>

				<div class="add-submit">
					<p class="ui-text-muted">بعد از ایجاد، لینک دعوت را می‌توانید برای دیگران بفرستید.</p>
					<button
						class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block"
						type="submit"
						disabled={submitting}
					>
						{#if submitting}
							<span class="ui-spinner" aria-hidden="true"></span>
							<span>در حال ایجاد ختم…</span>
						{:else}
							<span>ایجاد ختم و دریافت لینک</span>
							<IconArrow aria-hidden="true" />
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
{:else}
	<SucessResult khatm={Khatm.fromPlain(form.khatm)} claimToken={form.guestClaimToken} />
{/if}

<Modal bind:open={aiWarningOpen} contentClass="add-ai-warning-dialog">
	{#if aiWarning}
		<section aria-labelledby="ai-warning-title">
			<h2 id="ai-warning-title">نیاز به بررسی عنوان ختم</h2>
			<p>{aiWarning.reason}</p>
			<p class="ui-text-muted">می‌توانید متن را اصلاح کنید یا با مسئولیت خودتان ختم را ثبت کنید.</p>
			<div class="add-ai-warning-actions">
				<button class="ui-btn ui-btn-outline" type="button" onclick={reviseContent}>ویرایش متن</button>
				<button class="ui-btn ui-btn-primary" type="button" onclick={forceCreate}>ثبت با وجود هشدار</button>
			</div>
		</section>
	{/if}
</Modal>

<style>
	.add-shell {
		width: 100%;
		max-width: 44rem;
		margin-right: auto;
		margin-left: auto;
	}

	:global(.add-ai-warning-dialog) h2,
	:global(.add-ai-warning-dialog) p {
		margin-top: 0;
	}

	:global(.add-ai-warning-dialog) p {
		line-height: 1.8;
	}

	.add-ai-warning-actions {
		display: flex;
		justify-content: flex-start;
		margin-top: 1rem;
	}

	.add-ai-warning-actions > * + * {
		margin-right: 0.5rem;
	}

	.add-intro {
		display: flex;
		align-items: center;
		margin-bottom: 0.85rem;
		padding: 1.1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-lg);
		background: linear-gradient(
			135deg,
			var(--ui-color-primary-softer),
			var(--ui-color-surface-raised) 62%,
			var(--ui-color-accent-soft)
		);
		box-shadow: var(--ui-shadow-sm);
	}

	.add-intro > * + * {
		margin-right: 1rem;
	}

	.add-intro-icon {
		display: flex;
		width: 3.35rem;
		height: 3.35rem;
		flex: 0 0 3.35rem;
		align-items: center;
		justify-content: center;
		border-radius: 1.25rem;
		border: 1px solid var(--ui-color-accent);
		background: var(--ui-color-accent-soft);
		color: var(--ui-color-accent);
		font-size: 1.7rem;
		box-shadow: var(--ui-shadow-sm);
		transform: rotate(-4deg);
	}

	.add-intro h2,
	.add-intro p,
	.add-section-heading h3,
	.add-section-heading p,
	.add-submit p {
		margin: 0;
	}

	.add-intro h2 {
		margin-top: 0.1rem;
		font-size: 1.25rem;
		font-weight: 900;
	}

	.add-intro > div:last-child > p:last-child {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.8rem;
		line-height: 1.7;
	}

	.add-eyebrow {
		color: var(--ui-color-primary);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.add-form {
		border-color: var(--ui-color-control-border);
		border-top: 3px solid var(--ui-color-primary);
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-md);
	}

	.add-form :global(.ui-card-body) {
		padding: 0;
	}

	.add-section {
		padding: 1.15rem;
		background: var(--ui-color-surface-raised);
	}

	.add-section + .add-section {
		border-top: 1px solid var(--ui-color-border);
	}

	.add-section-heading {
		display: flex;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.add-section-heading > * + * {
		margin-right: 0.6rem;
	}

	.add-step {
		display: flex;
		width: 1.8rem;
		height: 1.8rem;
		flex: 0 0 1.8rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.7rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		font-size: 0.8rem;
		font-weight: 900;
		box-shadow: inset 0 0 0 1px var(--ui-color-border);
	}

	.add-section:nth-of-type(2) .add-step {
		background: var(--ui-color-info-soft);
		color: var(--ui-color-info);
	}

	.add-section:nth-of-type(3) .add-step {
		background: var(--ui-color-accent-soft);
		color: var(--ui-color-accent);
	}

	.add-section-heading h3 {
		font-size: 1rem;
		font-weight: 900;
	}

	.add-section-heading p {
		margin-top: 0.1rem;
		color: var(--ui-color-text-muted);
		font-size: 0.75rem;
		line-height: 1.6;
	}

	.add-fields {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 0.35rem;
	}

	.add-fields :global(.ui-field-label) {
		color: var(--ui-color-text-soft);
		font-size: 0.76rem;
	}

	.add-fields :global(.ui-input),
	.add-fields :global(.ui-textarea) {
		border-radius: 0.9rem;
	}

	.add-fields :global(.ui-input) {
		height: 3.25rem;
	}

	.add-fields :global(.ui-textarea) {
		min-height: 6rem;
	}

	.add-optional {
		margin-right: 0.45rem;
		padding: 0.1rem 0.4rem;
		border-radius: 9999px;
		background: var(--ui-color-accent-soft);
		color: var(--ui-color-accent);
		font-size: 0.65rem;
		font-weight: 800;
	}

	.add-form :global(.ui-range-type-picker-option) {
		border-color: var(--ui-color-control-border);
		background: var(--ui-color-control-surface);
		box-shadow: var(--ui-shadow-inset);
	}

	.add-form :global(.ui-range-type-picker-option:hover) {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
	}

	.add-form :global(.ui-range-type-picker-option[data-selected='true']) {
		background: var(--ui-color-primary-softer);
	}

	.add-form :global(.ui-range-type-picker-icon) {
		border: 1px solid var(--ui-color-border);
		background: var(--ui-color-surface-muted);
	}

	.add-form :global(.ui-range-type-picker-option[data-selected='true'] .ui-range-type-picker-icon) {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary);
	}

	.add-choice-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 0.5rem;
	}

	.add-choice,
	.add-series {
		display: flex;
		align-items: center;
		padding: 0.7rem;
		border: 1px solid var(--ui-color-control-border);
		border-radius: var(--ui-radius-md);
		background: var(--ui-color-control-surface);
		box-shadow: var(--ui-shadow-inset);
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			box-shadow 160ms ease;
	}

	.add-choice:hover,
	.add-series:hover {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
	}

	.add-choice[data-selected='true'],
	.add-series[data-selected='true'] {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
		box-shadow: 0 0 0 2px var(--ui-color-focus);
	}

	.add-choice > * + *,
	.add-series > * + * {
		margin-right: 0.55rem;
	}

	.add-choice-icon {
		display: flex;
		width: 2rem;
		height: 2rem;
		flex: 0 0 2rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.7rem;
		border: 1px solid var(--ui-color-border);
		background: var(--ui-color-surface-muted);
		color: var(--ui-color-primary);
		font-size: 1.05rem;
	}

	.add-choice[data-selected='true'] .add-choice-icon,
	.add-series[data-selected='true'] .add-choice-icon {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary);
		color: var(--ui-color-on-primary);
		box-shadow: var(--ui-shadow-sm);
	}

	.add-choice-copy {
		display: flex;
		min-width: 0;
		flex: 1 1 auto;
		flex-direction: column;
	}

	.add-choice-copy strong {
		font-size: 0.85rem;
		font-weight: 900;
	}

	.add-choice-copy small {
		margin-top: 0.1rem;
		color: var(--ui-color-text-muted);
		font-size: 0.7rem;
		line-height: 1.6;
	}

	.add-series {
		margin-top: 0.5rem;
	}

	.add-submit {
		padding: 1rem;
		border-top: 1px solid var(--ui-color-border);
		background: var(--ui-color-surface-muted);
	}

	.add-submit :global(.ui-btn-primary) {
		box-shadow: 0 8px 22px var(--ui-color-focus);
	}

	.add-submit p {
		margin-bottom: 0.5rem;
		font-size: 0.72rem;
		text-align: center;
	}

	@media (min-width: 640px) {
		.add-section {
			padding: 1.35rem;
		}

		.add-choice-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.add-submit {
			padding: 1rem 1.2rem 1.2rem;
		}
	}

	@media (max-width: 420px) {
		.add-intro-icon {
			width: 3.25rem;
			height: 3.25rem;
			flex-basis: 3.25rem;
			font-size: 1.6rem;
		}

		.add-intro h2 {
			font-size: 1.15rem;
		}
	}
</style>
