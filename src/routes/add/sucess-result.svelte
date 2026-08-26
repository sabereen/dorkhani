<script lang="ts">
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import KhatmShareModal from '$lib/components/KhatmShareModal.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { CreatedKhatm } from '$lib/entity/CreatedKhatm'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import { onMount } from 'svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconShare from '~icons/ic/outline-share'
	import IconOpen from '~icons/ic/round-open-in-new'
	import IconLink from '~icons/ic/round-link'
	import IconChat from '~icons/ic/round-chat'
	import { page } from '$app/state'
	import { createMiniAppLink } from '$lib/miniapp/links'
	import { miniAppState } from '$lib/miniapp/state.svelte'
	import copyToClipboard from 'clipboard-copy'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		khatm: Khatm
		claimToken?: string | null
	}

	const { khatm, claimToken }: Props = $props()

	let copied = $state(false)
	let platformCopied = $state(false)
	let shareOpen = $state(false)
	const platform = $derived(miniAppState.host)
	const platformName = $derived(
		platform === 'bale' ? m.account_bale() : platform === 'eitaa' ? m.account_eitaa() : '',
	)
	const platformUrl = $derived(
		platform ? createMiniAppLink(page.data.miniAppUrls[platform], khatm.getPath()) : null,
	)

	async function copy() {
		try {
			await khatm.copy()
			copied = true
			toast('info', m.success_invite_copied())
		} catch (err) {
			copied = false
			console.error(err)
			toast('error', m.common_copy_error())
		}
	}

	async function copyPlatformLink() {
		if (!platformUrl) return
		try {
			try {
				await navigator.clipboard.writeText(platformUrl)
			} catch {
				await copyToClipboard(platformUrl)
			}
			platformCopied = true
			toast('info', m.share_link_copied())
		} catch (err) {
			console.error(err)
			platformCopied = false
			toast('error', m.common_copy_error())
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
	<p class="success-eyebrow">{m.success_ready()}</p>
	<h2 id="success-title">{m.success_created()}</h2>
	<p>{m.success_description()}</p>
	</section>

	<section class="ui-card ui-card-bordered success-card" aria-label={m.success_details()}>
		<div class="ui-card-body">
			<div class="success-title-row">
				<div>
					<p>{m.add_khatm_title()}</p>
					<h3>{khatm.title}</h3>
				</div>
				<div class="success-badges">
					<span class="ui-badge ui-badge-info ui-range-type-badge">
						<RangeTypeIcon type={khatm.rangeType} />
						{khatm.rangeTypeTitle}
					</span>
					{#if khatm.private}
						<span class="ui-badge ui-badge-neutral">{m.add_private()}</span>
					{:else}
						<span class="ui-badge ui-badge-outline">{m.add_public()}</span>
					{/if}
					{#if khatm.isSerial}<span class="ui-badge ui-badge-accent">{m.add_serial()}</span>{/if}
				</div>
			</div>

			{#if khatm.description}
				<div dir="auto" class="success-description">
					<ExpandableText text={khatm.description} maxLength={250} />
				</div>
			{/if}

			<div class="success-link-panel">
				<div class="success-link-heading">
					<span class="success-link-icon" aria-hidden="true">
						<IconLink />
					</span>
					<div class="success-link-copy">
						<p class="success-link-title">{m.success_invite_ready()}</p>
						<p class="success-link-hint">{m.success_invite_hint()}</p>
					</div>
					<span class="ui-badge ui-badge-success success-link-badge">{m.success_ready_to_send()}</span>
				</div>

				<div class="success-link-control">
					<a
						href={khatm.link}
						class="success-link"
						target="_blank"
						rel="noopener"
						dir="ltr"
						aria-label={m.success_open_link()}
					>
						<span>{khatm.link}</span>
						<IconOpen aria-hidden="true" />
					</a>
					<button
						class={`ui-btn success-copy-button ${copied ? 'ui-btn-success' : 'ui-btn-primary'}`}
						type="button"
						onclick={copy}
						aria-label={copied ? m.success_invite_copied() : m.success_copy_invite()}
						aria-live="polite"
					>
						{#if copied}
							<IconCheck aria-hidden="true" />
							<span>{m.success_copied()}</span>
						{:else}
							<IconCopy aria-hidden="true" />
							<span>{m.success_copy_invite()}</span>
						{/if}
					</button>
				</div>
			</div>

			{#if platformUrl}
				<div class="success-platform-panel">
					<span class="success-platform-icon" aria-hidden="true"><IconChat /></span>
					<div class="success-platform-copy">
						<strong>{m.share_direct_link({ provider: platformName })}</strong>
						<p>{m.success_miniapp_link_hint({ provider: platformName })}</p>
						<a href={platformUrl} target="_blank" rel="noopener" dir="ltr">{platformUrl}</a>
					</div>
					<button
						class={`ui-btn ui-btn-sm ${platformCopied ? 'ui-btn-success' : 'ui-btn-soft'}`}
						type="button"
						onclick={copyPlatformLink}
					>
						{#if platformCopied}<IconCheck />{:else}<IconCopy />{/if}
						{platformCopied ? m.success_copied() : m.share_copy_link()}
					</button>
				</div>
			{/if}

			<div class="success-actions">
				<a href={khatm.link} class="ui-btn ui-btn-primary ui-btn-lg" target="_blank" rel="noopener">
					<IconOpen aria-hidden="true" />
						{m.success_open_khatm()}
				</a>
				<button class="ui-btn ui-btn-soft ui-btn-lg" type="button" onclick={() => (shareOpen = true)}>
					<IconShare aria-hidden="true" />
					{m.common_share()}
				</button>
			</div>
		</div>
	</section>

	<p class="success-note">{m.success_saved_note()}</p>
</div>

<KhatmShareModal bind:open={shareOpen} {khatm} />

<style>
	.success-shell {
		width: 100%;
		max-width: 44rem;
		margin-inline-start: auto;
		margin-inline-end: auto;
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
	.success-link-panel p,
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
		margin-inline-start: 1rem;
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
		margin-inline-start: 0.35rem;
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
		padding: 1rem;
		border: 1px solid var(--ui-color-border);
		border-inline-start: 0.25rem solid var(--ui-color-primary);
		border-radius: var(--ui-radius-lg);
		background: var(--ui-color-surface-muted);
		box-shadow: var(--ui-shadow-sm);
	}

	.success-link-heading {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-gap: 0.75rem;
		align-items: center;
	}

	.success-link-icon {
		display: flex;
		width: 2.75rem;
		height: 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.success-link-icon :global(svg) {
		width: 1.4rem;
		height: 1.4rem;
	}

	.success-link-copy {
		min-width: 0;
	}

	.success-link-title {
		font-size: 0.9rem;
		font-weight: 900;
	}

	.success-link-hint {
		margin-top: 0.15rem !important;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
		line-height: 1.7;
	}

	.success-link-badge {
		white-space: nowrap;
	}

	.success-link-control {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-gap: 0.5rem;
		align-items: center;
		margin-top: 0.85rem;
		padding: 0.35rem;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: var(--ui-radius-md);
		background: var(--ui-color-surface);
	}

	.success-link {
		display: flex;
		height: 2.75rem;
		min-width: 0;
		align-items: center;
		padding-inline-start: 0.5rem;
		padding-inline-end: 0.5rem;
		color: var(--ui-color-primary);
		font-size: 0.82rem;
		font-weight: 700;
		text-align: end;
		text-decoration: none;
	}

	.success-link span {
		min-width: 0;
		flex: 1 1 auto;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.success-link :global(svg) {
		width: 1rem;
		height: 1rem;
		flex: 0 0 auto;
		margin-inline-end: 0.45rem;
	}

	.success-link:hover {
		color: var(--ui-color-primary-hover);
		text-decoration: underline;
	}

	.success-copy-button {
		min-width: 7.5rem;
	}

	.success-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 0.65rem;
		margin-top: 0.35rem;
	}

	.success-platform-panel {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-gap: 0.75rem;
		align-items: center;
		padding: 0.85rem;
		border: 1px solid var(--ui-color-border);
		border-inline-start: 0.25rem solid var(--ui-color-primary);
		border-radius: var(--ui-radius-lg);
		background: var(--ui-color-primary-softer);
	}

	.success-platform-icon {
		display: flex;
		width: 2.75rem;
		height: 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		font-size: 1.4rem;
	}

	.success-platform-copy {
		min-width: 0;
	}

	.success-platform-copy strong,
	.success-platform-copy p,
	.success-platform-copy a {
		display: block;
		margin: 0;
	}

	.success-platform-copy strong {
		font-size: 0.84rem;
	}

	.success-platform-copy p {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
		font-size: 0.7rem;
	}

	.success-platform-copy a {
		margin-top: 0.3rem;
		color: var(--ui-color-primary);
		font-size: 0.68rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
			margin-inline-start: 0;
		}

		.success-link-badge {
			display: none;
		}

		.success-link-control {
			grid-template-columns: minmax(0, 1fr);
		}

		.success-copy-button {
			width: 100%;
		}

		.success-platform-panel {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.success-platform-panel .ui-btn {
			grid-column: 1 / -1;
			width: 100%;
		}
	}
</style>
