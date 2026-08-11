<script lang="ts">
	import { browser } from '$app/environment'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { onMount } from 'svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'
	import IconOpen from '~icons/ic/round-open-in-new'
	import IconLink from '~icons/ic/round-link'

	type Props = {
		khatm: Khatm
		claimToken?: string | null
	}

	const { khatm, claimToken }: Props = $props()

	const canShare = !browser || navigator.share

	async function copy() {
		try {
			await khatm.copy()
			toast('info', 'لینک ختم قرآن شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی.')
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
			claimToken: claimToken || undefined,
		}).save()
	})
</script>

<div class="success-shell">
	<section class="success-hero" aria-labelledby="success-title">
		<div class="success-mark" aria-hidden="true">
			<IconCheck />
		</div>
		<p class="success-eyebrow">همه‌چیز آماده است</p>
		<h2 id="success-title">ختم شما با موفقیت ایجاد شد</h2>
		<p>لینک زیر را برای همراهانتان بفرستید تا قرائت گروهی را آغاز کنید.</p>
	</section>

	<section class="ui-card ui-card-bordered success-card" aria-label="مشخصات ختم ایجاد شده">
		<div class="ui-card-body">
			<div class="success-title-row">
				<div>
					<p>عنوان ختم</p>
					<h3>{khatm.title}</h3>
				</div>
				<div class="success-badges">
					<span class="ui-badge ui-badge-info">{khatm.rangeTypeTitle}</span>
					{#if khatm.private}
						<span class="ui-badge ui-badge-neutral">خصوصی</span>
					{:else}
						<span class="ui-badge ui-badge-outline">عمومی</span>
					{/if}
					{#if khatm.isSerial}<span class="ui-badge ui-badge-accent">پیوسته</span>{/if}
				</div>
			</div>

			{#if khatm.description}
				<div dir="auto" class="success-description">
					<ExpandableText text={khatm.description} maxLength={250} />
				</div>
			{/if}

			<div class="success-link-panel">
				<div class="success-link-label">
					<IconLink aria-hidden="true" />
					<span>لینک دعوت</span>
				</div>
				<a href={khatm.link} class="success-link" target="_blank" rel="noopener" dir="ltr">
					{khatm.link}
				</a>
				<button class="ui-btn ui-btn-outline ui-btn-sm" type="button" onclick={copy}>
					<IconCopy aria-hidden="true" />
					کپی لینک
				</button>
			</div>

			<div class="success-actions">
				<a href={khatm.link} class="ui-btn ui-btn-primary ui-btn-lg" target="_blank" rel="noopener">
					<IconOpen aria-hidden="true" />
					ورود به صفحهٔ ختم
				</a>
				{#if canShare}
					<button class="ui-btn ui-btn-soft ui-btn-lg" type="button" onclick={share}>
						<IconShare aria-hidden="true" />
						اشتراک‌گذاری
					</button>
				{/if}
			</div>
		</div>
	</section>

	<p class="success-note">این ختم در بخش «فعالیت‌های من» نیز ذخیره شده است.</p>
</div>

<style>
	.success-shell {
		width: 100%;
		max-width: 44rem;
		margin-right: auto;
		margin-left: auto;
		padding-top: 1rem;
	}

	.success-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 1rem 1.75rem;
		text-align: center;
	}

	.success-hero > * + * {
		margin-top: 0.45rem;
	}

	.success-mark {
		display: flex;
		width: 5rem;
		height: 5rem;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.35rem;
		border-radius: 9999px;
		background: var(--ui-color-success-soft);
		color: var(--ui-color-success);
		font-size: 3.5rem;
		box-shadow: 0 0 0 0.65rem var(--ui-color-surface-muted);
	}

	.success-hero p,
	.success-hero h2,
	.success-title-row p,
	.success-title-row h3,
	.success-note {
		margin-bottom: 0;
		margin-top: 0;
	}

	.success-eyebrow {
		color: var(--ui-color-success);
		font-size: 0.75rem;
		font-weight: 900;
	}

	.success-hero h2 {
		font-size: 1.5rem;
		font-weight: 900;
	}

	.success-hero > p:last-child {
		max-width: 30rem;
		color: var(--ui-color-text-muted);
		font-size: 0.85rem;
		line-height: 1.8;
	}

	.success-card {
		box-shadow: var(--ui-shadow-md);
	}

	.success-card :global(.ui-card-body) {
		padding: 1.25rem;
	}

	.success-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.success-title-row > * + * {
		margin-right: 1rem;
	}

	.success-title-row > div:first-child {
		min-width: 0;
	}

	.success-title-row p {
		color: var(--ui-color-text-muted);
		font-size: 0.7rem;
		font-weight: 700;
	}

	.success-title-row h3 {
		margin-top: 0.2rem;
		font-size: 1.15rem;
		font-weight: 900;
		word-break: break-word;
	}

	.success-badges {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		flex-wrap: wrap;
	}

	.success-badges > * + * {
		margin-right: 0.35rem;
	}

	.success-description {
		padding: 0.8rem 0;
		border-top: 1px solid var(--ui-color-border);
		border-bottom: 1px solid var(--ui-color-border);
		color: var(--ui-color-text-muted);
		font-size: 0.85rem;
		line-height: 1.9;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.success-link-panel {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-gap: 0.6rem;
		align-items: center;
		padding: 0.85rem;
		border: 1px dashed var(--ui-color-border-strong);
		border-radius: var(--ui-radius-md);
		background: var(--ui-color-surface-muted);
	}

	.success-link-label {
		display: flex;
		grid-column: 1 / -1;
		align-items: center;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.success-link-label > * + * {
		margin-right: 0.35rem;
	}

	.success-link-label :global(svg) {
		width: 1rem;
		height: 1rem;
		color: var(--ui-color-primary);
	}

	.success-link {
		min-width: 0;
		overflow: hidden;
		color: var(--ui-color-primary);
		font-size: 0.82rem;
		font-weight: 700;
		text-align: left;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.success-link:hover {
		color: var(--ui-color-primary-hover);
		text-decoration: underline;
	}

	.success-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 0.65rem;
		margin-top: 0.35rem;
	}

	.success-note {
		padding: 0.9rem;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
		text-align: center;
	}

	@media (min-width: 560px) {
		.success-card :global(.ui-card-body) {
			padding: 1.5rem;
		}

		.success-actions {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 420px) {
		.success-hero h2 {
			font-size: 1.25rem;
		}

		.success-title-row {
			flex-direction: column;
		}

		.success-title-row > * + * {
			margin-top: 0.65rem;
			margin-right: 0;
		}

		.success-link-panel {
			grid-template-columns: minmax(0, 1fr);
		}

		.success-link-panel .ui-btn {
			width: 100%;
		}
	}
</style>
