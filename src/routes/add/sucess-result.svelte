<script lang="ts">
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import KhatmShareModal from '$lib/components/KhatmShareModal.svelte'
	import { toast } from '$lib/components/toast.svelte'
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
		platform === 'bale'
			? m.account_bale()
			: platform === 'eitaa'
				? m.account_eitaa()
				: platform === 'soroush'
					? m.account_soroush()
					: '',
	)
	const platformUrl = $derived(
		platform ? createMiniAppLink(page.data.miniAppUrls[platform], khatm.getPath(), platform) : null,
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

<div class="ui-success-shell">
	<section class="ui-success-hero" aria-labelledby="success-title">
		<div class="ui-success-mark" aria-hidden="true">
			<IconCheck />
		</div>
		<p class="ui-success-eyebrow">{m.success_ready()}</p>
		<h2 id="success-title">{m.success_created()}</h2>
		<p>{m.success_description()}</p>
	</section>

	<section class="ui-card ui-card-bordered ui-success-card" aria-label={m.success_details()}>
		<div class="ui-card-body">
			<div class="ui-success-title-row">
				<div>
					<p>{m.add_khatm_title()}</p>
					<h3>{khatm.title}</h3>
				</div>
				<div class="ui-success-badges">
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
				<div dir="auto" class="ui-success-description">
					<ExpandableText text={khatm.description} maxLength={250} />
				</div>
			{/if}

			<div class="ui-success-link-panel">
				<div class="ui-success-link-heading">
					<span class="ui-success-link-icon" aria-hidden="true">
						<IconLink />
					</span>
					<div class="ui-success-link-copy">
						<p class="ui-success-link-title">{m.success_invite_ready()}</p>
						<p class="ui-success-link-hint">{m.success_invite_hint()}</p>
					</div>
					<span class="ui-badge ui-badge-success ui-success-link-badge"
						>{m.success_ready_to_send()}</span
					>
				</div>

				<div class="ui-success-link-control">
					<a
						href={khatm.link}
						class="ui-success-link"
						target="_blank"
						rel="noopener"
						dir="ltr"
						aria-label={m.success_open_link()}
					>
						<span>{khatm.link}</span>
						<IconOpen aria-hidden="true" />
					</a>
					<button
						class={`ui-btn ui-success-copy-button ${copied ? 'ui-btn-success' : 'ui-btn-primary'}`}
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
				<div class="ui-success-platform-panel">
					<span class="ui-success-platform-icon" aria-hidden="true"><IconChat /></span>
					<div class="ui-success-platform-copy">
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

			<div class="ui-success-actions">
				<a href={khatm.link} class="ui-btn ui-btn-primary ui-btn-lg" target="_blank" rel="noopener">
					<IconOpen aria-hidden="true" />
					{m.success_open_khatm()}
				</a>
				<button
					class="ui-btn ui-btn-soft ui-btn-lg"
					type="button"
					onclick={() => (shareOpen = true)}
				>
					<IconShare aria-hidden="true" />
					{m.common_share()}
				</button>
			</div>
		</div>
	</section>

	<p class="ui-success-note">{m.success_saved_note()}</p>
</div>

<KhatmShareModal bind:open={shareOpen} {khatm} />
