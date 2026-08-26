<script lang="ts">
	import { browser } from '$app/environment'
	import Modal from './Modal.svelte'
	import { toast } from './TheToast.svelte'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { createMiniAppLink } from '$lib/miniapp/links'
	import { miniAppState } from '$lib/miniapp/state.svelte'
	import { page } from '$app/state'
	import { onDestroy, tick, untrack } from 'svelte'
	import copyToClipboard from 'clipboard-copy'
	import IconBook from '~icons/ic/round-menu-book'
	import IconClose from '~icons/ic/round-close'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconDownload from '~icons/ic/round-download'
	import IconLink from '~icons/ic/round-link'
	import IconRefresh from '~icons/ic/round-refresh'
	import IconShare from '~icons/ic/outline-share'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		open?: boolean
		khatm: Khatm
	}

	let { open = $bindable(false), khatm }: Props = $props()
	let captureCard = $state<HTMLElement>()
	let imageBlob = $state<Blob | null>(null)
	let previewUrl = $state<string | null>(null)
	let generating = $state(false)
	let generationError = $state(false)
	let generationVersion = 0

	const platform = $derived(miniAppState.host)
	const platformName = $derived(
		platform === 'bale' ? m.account_bale() : platform === 'eitaa' ? m.account_eitaa() : '',
	)
	const platformUrl = $derived(
		platform ? createMiniAppLink(page.data.miniAppUrls[platform], khatm.getPath()) : null,
	)
	const preferredUrl = $derived(platformUrl || khatm.publicLink)
	const shareText = $derived(
		m.share_khatm({ title: khatm.title, description: khatm.description }).trim(),
	)
	const inviteText = $derived(`${shareText}\n${preferredUrl}`)

	function revokePreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl)
		previewUrl = null
		imageBlob = null
	}

	async function generateImage() {
		if (!browser || !captureCard || generating) return
		const version = ++generationVersion
		generating = true
		generationError = false
		try {
			await tick()
			await document.fonts?.ready
			const { domToBlob } = await import('modern-screenshot')
			const blob = await domToBlob(captureCard, {
				width: 720,
				height: 405,
				scale: 2,
				style: { transform: 'none' },
			})
			if (!blob) throw new Error('Share card image was not generated')
			if (version !== generationVersion || !open) return
			revokePreview()
			imageBlob = blob
			previewUrl = URL.createObjectURL(blob)
		} catch (error) {
			console.error(error)
			if (version === generationVersion) generationError = true
		} finally {
			if (version === generationVersion) generating = false
		}
	}

	$effect(() => {
		const imageKey = `${khatm.id}:${platformUrl || ''}`
		void imageKey
		if (!open) {
			generationVersion += 1
			untrack(revokePreview)
			generating = false
			generationError = false
			return
		}
		untrack(() => void generateImage())
	})

	onDestroy(revokePreview)

	async function writeText(value: string, successMessage: string) {
		try {
			try {
				await navigator.clipboard.writeText(value)
			} catch {
				await copyToClipboard(value)
			}
			toast('info', successMessage)
		} catch (error) {
			console.error(error)
			toast('error', m.common_copy_error())
		}
	}

	function getShareFile() {
		if (!imageBlob) return null
		return new File([imageBlob], `khatm-${khatm.id}.png`, { type: 'image/png' })
	}

	function canShareFile(file: File | null) {
		return Boolean(file && navigator.canShare?.({ files: [file] }))
	}

	async function share() {
		if (!navigator.share) return
		const file = getShareFile()
		try {
			if (canShareFile(file)) {
				await navigator.share({ files: [file!], text: shareText, url: preferredUrl })
			} else {
				await navigator.share({ text: shareText, url: preferredUrl })
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return
			console.error(error)
			toast('error', m.share_action_error())
		}
	}

	function downloadImage() {
		if (!imageBlob || !previewUrl) return
		const anchor = document.createElement('a')
		anchor.download = `khatm-${khatm.id}.png`
		anchor.href = previewUrl
		anchor.click()
		toast('info', m.share_download_started())
	}
</script>

<Modal bind:open contentClass="ui-khatm-share-dialog" labelledBy="khatm-share-title">
	<button
		type="button"
		class="ui-btn ui-btn-icon ui-btn-ghost share-close"
		onclick={() => (open = false)}
		aria-label={m.common_close()}
	>
		<IconClose />
	</button>

	<header class="share-heading">
		<div class="share-heading-icon" aria-hidden="true"><IconShare /></div>
		<div>
			<h2 id="khatm-share-title">{m.share_dialog_title()}</h2>
			<p>{m.share_dialog_description()}</p>
		</div>
	</header>

	<div class="share-layout">
		<div class="share-preview" aria-live="polite">
			{#if previewUrl}
				<img src={previewUrl} alt={m.share_preview_alt({ title: khatm.title })} />
			{:else}
				<div class="share-preview-placeholder">
					<div>
						{#if generating}
							<span class="ui-spinner" aria-hidden="true"></span>
							<p>{m.share_generating_image()}</p>
						{:else if generationError}
							<p>{m.share_image_error()}</p>
							<button class="ui-btn ui-btn-soft ui-btn-sm" type="button" onclick={generateImage}>
								<IconRefresh />
								{m.share_retry_image()}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<div class="share-controls">
			<div class="share-primary-actions">
				{#if browser && navigator.share}
					<button
						class="ui-btn ui-btn-primary ui-btn-lg share-action-main"
						type="button"
						onclick={share}
					>
						<IconShare />
						{imageBlob && canShareFile(getShareFile())
							? m.share_share_card()
							: m.share_share_text()}
					</button>
				{/if}
				<button
					class="ui-btn ui-btn-soft whitespace-nowrap text-xs"
					type="button"
					onclick={downloadImage}
					disabled={!imageBlob}
				>
					<IconDownload />
					{m.share_download_card()}
				</button>
				<button
					class="ui-btn ui-btn-outline whitespace-nowrap text-xs"
					type="button"
					onclick={() => writeText(inviteText, m.share_text_copied())}
				>
					<IconCopy />
					{m.share_copy_text()}
				</button>
			</div>

			<section class="share-links" aria-label={m.share_links_title()}>
				<p class="share-links-title">{m.share_links_title()}</p>
				<div class="share-link-row">
					<span class="share-link-icon" aria-hidden="true"><IconLink /></span>
					<div class="share-link-copy">
						<strong>{m.share_normal_link()}</strong>
						<a href={khatm.publicLink} target="_blank" rel="noopener" dir="ltr">
							{khatm.publicLink}
						</a>
					</div>
					<button
						class="ui-btn ui-btn-icon ui-btn-ghost"
						type="button"
						onclick={() => writeText(khatm.publicLink, m.share_link_copied())}
						aria-label={m.share_copy_link()}
					>
						<IconCopy />
					</button>
				</div>

				{#if platformUrl}
					<div class="share-link-row share-link-row-direct">
						<span class="share-link-icon" aria-hidden="true"><IconShare /></span>
						<div class="share-link-copy">
							<strong>{m.share_direct_link({ provider: platformName })}</strong>
							<a href={platformUrl} target="_blank" rel="noopener" dir="ltr">
								{platformUrl}
							</a>
						</div>
						<button
							class="ui-btn ui-btn-icon ui-btn-ghost"
							type="button"
							onclick={() => writeText(platformUrl, m.share_link_copied())}
							aria-label={m.share_copy_link()}
						>
							<IconCopy />
						</button>
					</div>
				{/if}
			</section>
		</div>
	</div>
</Modal>

<div
	class="pointer-events-none fixed left-0 top-[-10000px] h-[405px] w-[720px] overflow-hidden"
	aria-hidden="true"
>
	<article
		bind:this={captureCard}
		class="relative box-border h-[405px] w-[720px] overflow-hidden bg-[#0b493b] p-[18px] text-[#102d27]"
	>
		<div
			class="absolute right-[-82px] top-[-112px] h-[245px] w-[245px] rounded-full bg-[#d5a94e] opacity-[0.22]"
		></div>
		<div
			class="absolute bottom-[-120px] left-[-80px] h-[220px] w-[220px] rounded-full bg-[#e87857] opacity-20"
		></div>
		<div
			class="relative z-[1] grid h-[369px] w-[684px] grid-cols-[minmax(0,1fr)_218px] overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.36)] bg-[#fbf7ec] shadow-[0_18px_36px_rgba(2,38,30,0.3)]"
		>
			<div
				class="box-border flex min-w-0 flex-col justify-between bg-[#fbf7ec] px-[30px] pb-[26px] pt-[25px]"
			>
				<header class="flex items-center justify-between">
					<div
						class="flex min-w-0 max-w-[170px] items-center whitespace-nowrap text-[15px] font-black text-[#174e40]"
					>
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#176f55] text-[18px] text-[#fff9e9]"
							><IconBook /></span
						>
						<span class="ms-2 min-w-0 truncate">{page.data.branding.name}</span>
					</div>
					<p
						class="font-800 m-0 flex shrink-0 items-center whitespace-nowrap text-[11px] text-[#6a766f]"
					>
						<span class="me-[7px] block h-[6px] w-[6px] rounded-full bg-[#d2a849]"></span>
						{m.share_card_eyebrow()}
					</p>
				</header>

				<div class="pb-1 pt-[5px]">
					<div
						class="font-800 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#b15f43]"
					>
						<span class="me-2 text-[17px] text-[#d1a139]">✦</span>
						{m.share_card_invitation()}
					</div>
					<h3
						class="mb-0 mt-[7px] line-clamp-2 max-h-[92px] overflow-hidden text-[31px] font-black leading-[1.42] text-[#123e33]"
						dir="auto"
					>
						{khatm.title}
					</h3>
					<div class="mt-[9px] flex flex-wrap justify-start">
						<span
							class="font-800 my-[3px] me-[6px] shrink-0 whitespace-nowrap rounded-full border border-[#c4d8cf] bg-[#e9f2ed] px-[10px] py-1 text-[11px] text-[#176f55]"
						>
							{khatm.rangeTypeTitle}
						</span>
						{#if khatm.private}
							<span
								class="font-800 my-[3px] me-[6px] shrink-0 whitespace-nowrap rounded-full border border-[#c4d8cf] bg-[#e9f2ed] px-[10px] py-1 text-[11px] text-[#176f55]"
							>
								{m.add_private()}
							</span>
						{/if}
						{#if khatm.isSerial}
							<span
								class="font-800 my-[3px] me-[6px] shrink-0 whitespace-nowrap rounded-full border border-[#c4d8cf] bg-[#e9f2ed] px-[10px] py-1 text-[11px] text-[#176f55]"
							>
								{khatm.getRoundTitle()}
							</span>
						{/if}
					</div>
				</div>

				<footer
					dir="ltr"
					class="box-border flex items-center justify-start rounded-[14px] border border-[#d7dfd9] bg-white px-[13px] py-[10px] text-[#244c41] shadow-[0_7px_16px_rgba(24,79,64,0.06)]"
				>
					<span
						class="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[10px] bg-[#d9ab46] text-[16px] text-[#173f35]"
						aria-hidden="true"><IconLink /></span
					>
					<span class="font-800 ms-3 whitespace-nowrap text-[11px] text-[#176f55]" dir="ltr">
						{preferredUrl}
					</span>
				</footer>
			</div>

			<aside
				class="relative box-border flex flex-col items-center justify-center overflow-hidden bg-[#dfaf4a] px-[19px] py-[22px] text-[#f8f2de]"
			>
				<div class="absolute right-[25px] top-[27px] text-[20px] text-[rgba(24,79,64,0.55)]">✦</div>
				<div class="absolute bottom-[44px] left-[22px] text-[13px] text-[rgba(24,79,64,0.55)]">
					✦
				</div>
				<div
					class="absolute left-[-48px] top-[-54px] h-[150px] w-[150px] rounded-full border-[18px] border-[rgba(255,246,211,0.24)]"
				></div>
				<div
					class="relative z-[1] flex h-[250px] w-[150px] flex-col items-center justify-center rounded-[78px_78px_28px_28px] border-2 border-[rgba(255,250,230,0.7)] bg-[#145645] px-[15px] pb-[20px] pt-[23px] text-center shadow-[0_15px_25px_rgba(69,49,9,0.2)]"
				>
					<span class="text-[20px] text-[#f0c85e]">✦</span>
					<div
						class="mt-[13px] flex h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-[rgba(240,200,94,0.28)] bg-[#fff8e5] text-[38px] text-[#b86447] shadow-[0_10px_22px_rgba(3,38,30,0.25)]"
					>
						<IconBook />
					</div>
					<span
						class="font-800 mt-[15px] max-w-[130px] truncate whitespace-nowrap text-[12px] leading-[1.75] text-[#fff8e8]"
						>{page.data.branding.tagline}</span
					>
				</div>
				<div class="absolute bottom-[22px] z-[1] flex">
					<i class="mx-[3px] block h-[5px] w-[5px] rounded-full bg-[#fff3cf]"></i>
					<i class="mx-[3px] block h-[5px] w-[5px] rounded-full bg-[#fff3cf]"></i>
					<i class="mx-[3px] block h-[5px] w-[5px] rounded-full bg-[#fff3cf]"></i>
				</div>
			</aside>
		</div>
	</article>
</div>

<style>
	:global(.ui-khatm-share-dialog) {
		max-width: 62rem;
		padding: 1.25rem;
	}

	.share-close {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
	}

	[dir='ltr'] .share-close {
		left: auto;
		right: 0.75rem;
	}

	.share-heading {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
		padding-inline-end: 2.75rem;
	}

	.share-heading > * + * {
		margin-inline-start: 0.8rem;
	}

	.share-heading-icon {
		display: flex;
		width: 3rem;
		height: 3rem;
		flex: 0 0 3rem;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		font-size: 1.45rem;
	}

	.share-heading h2,
	.share-heading p,
	.share-preview-placeholder p {
		margin: 0;
	}

	.share-heading h2 {
		font-size: 1.15rem;
		font-weight: 900;
	}

	.share-heading p {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
		font-size: 0.76rem;
		line-height: 1.7;
	}

	.share-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.8fr);
		grid-gap: 1rem;
		align-items: start;
	}

	.share-preview {
		min-width: 0;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-lg);
		background: var(--ui-color-surface-inset);
		box-shadow: var(--ui-shadow-md);
		overflow: hidden;
	}

	.share-preview img {
		display: block;
		width: 100%;
		height: auto;
	}

	.share-preview-placeholder {
		position: relative;
		padding-top: 56.25%;
	}

	.share-preview-placeholder > div {
		position: absolute;
		top: 50%;
		left: 1rem;
		right: 1rem;
		color: var(--ui-color-text-muted);
		text-align: center;
		transform: translateY(-50%);
	}

	.share-preview-placeholder p {
		margin-top: 0.55rem;
		margin-bottom: 0.65rem;
		font-size: 0.78rem;
	}

	.share-controls {
		padding: 0.85rem;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-lg);
		background: var(--ui-color-surface-muted);
	}

	.share-primary-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-gap: 0.55rem;
	}

	.share-action-main {
		grid-column: 1 / -1;
	}

	.share-links {
		margin-top: 0.8rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--ui-color-border);
	}

	.share-links-title {
		margin: 0 0 0.45rem;
		color: var(--ui-color-text-muted);
		font-size: 0.68rem;
		font-weight: 800;
	}

	.share-link-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-gap: 0.65rem;
		align-items: center;
		padding: 0.65rem;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-md);
		background: var(--ui-color-surface-muted);
	}

	.share-link-row + .share-link-row {
		margin-top: 0.5rem;
	}

	.share-link-row-direct {
		border-inline-start: 0.2rem solid var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
	}

	.share-link-icon {
		display: flex;
		width: 2.25rem;
		height: 2.25rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.share-link-copy {
		min-width: 0;
	}

	.share-link-copy strong,
	.share-link-copy a {
		display: block;
	}

	.share-link-copy strong {
		font-size: 0.76rem;
	}

	.share-link-copy a {
		margin-top: 0.1rem;
		color: var(--ui-color-primary);
		font-size: 0.68rem;
		line-height: 1.6;
		word-break: break-all;
	}

	@media (max-width: 700px) {
		.share-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.share-controls {
			padding: 0.85rem;
		}
	}

	@media (max-width: 520px) {
		:global(.ui-khatm-share-dialog) {
			padding: 0.9rem;
		}

		.share-heading-icon {
			width: 2.6rem;
			height: 2.6rem;
			flex-basis: 2.6rem;
		}

		.share-primary-actions {
			grid-template-columns: minmax(0, 1fr);
		}

		.share-action-main {
			grid-column: auto;
		}

		.share-link-row {
			padding: 0.6rem;
		}
	}
</style>
