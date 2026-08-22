<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import { enhance } from '$app/forms'
	import { validateForm } from '$lib/actions/validateForm'
	import AdminNav from '$lib/components/AdminNav.svelte'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import type { SubmitFunction } from '@sveltejs/kit'
	import type { PageProps } from './$types'
	import IconCleanup from '~icons/ic/round-delete-sweep'
	import IconInfo from '~icons/ic/round-check-circle'
	import IconNotification from '~icons/ic/round-notifications-active'
	import IconRefresh from '~icons/ic/round-refresh'
	import IconSave from '~icons/ic/round-save'
	import IconSettings from '~icons/ic/round-settings'
	import IconSupport from '~icons/ic/round-support-agent'
	import IconPsychology from '~icons/ic/round-psychology'

	const { data, form }: PageProps = $props()

	const { notification, supportLink, staleKhatmRetentionDays, aiKhatmReview } =
		/* svelte-ignore state_referenced_locally */ data

	const formData = $state({
		supportLink,
		staleKhatmRetentionDays,
		eitaa: notification.eitaa,
		eitaaToken: notification.eitaaToken || '',
		eitaaChatId: notification.eitaaChatId || '',
		aiKhatmReviewEnabled: aiKhatmReview.enabled,
		aiKhatmReviewBaseUrl: aiKhatmReview.baseUrl || '',
		aiKhatmReviewModel: aiKhatmReview.model || '',
		aiKhatmReviewApiKey: aiKhatmReview.apiKey || '',
	})
	let submitting = $state(false)
	let aiConnectionTestLoading = $state(false)
	let aiConnectionTest: { type: 'success' | 'error'; message: string } | null = $state(null)
	let baleWebhookLoading = $state(false)
	let baleWebhookResult: { type: 'success' | 'error'; message: string } | null = $state(null)

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

	async function testAiConnection() {
		aiConnectionTestLoading = true
		aiConnectionTest = null
		try {
			const response = await fetch('/api/admin/ai/test', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					baseUrl: formData.aiKhatmReviewBaseUrl,
					model: formData.aiKhatmReviewModel,
					apiKey: formData.aiKhatmReviewApiKey,
				}),
			})
			const result = await response.json().catch(() => ({}))
			if (!response.ok) throw new Error(result.message || 'تست اتصال ناموفق بود.')
			aiConnectionTest = { type: 'success', message: result.message }
		} catch (error) {
			aiConnectionTest = {
				type: 'error',
				message: error instanceof Error ? error.message : 'تست اتصال ناموفق بود.',
			}
		} finally {
			aiConnectionTestLoading = false
		}
	}

	async function setBaleWebhook() {
		baleWebhookLoading = true
		baleWebhookResult = null
		try {
			const response = await fetch('/api/admin/bale/webhook', { method: 'POST' })
			const result = await response.json().catch(() => ({}))
			if (!response.ok) throw new Error(result.message || 'تنظیم وب‌هوک بله ناموفق بود.')
			baleWebhookResult = { type: 'success', message: result.message }
		} catch (error) {
			baleWebhookResult = {
				type: 'error',
				message: error instanceof Error ? error.message : 'تنظیم وب‌هوک بله ناموفق بود.',
			}
		} finally {
			baleWebhookLoading = false
		}
	}

	watch(
		() => form,
		() => {
			if (form?.errorMessage) {
				toast('error', form.errorMessage)
				return
			}

			toast('info', 'تنظیمات با موفقیت ذخیره شد.')
			formData.supportLink = form?.supportLink || ''
			formData.staleKhatmRetentionDays =
				form?.staleKhatmRetentionDays || data.staleKhatmRetentionDays
			formData.eitaa = form?.eitaa
			formData.eitaaToken = form?.eitaaToken || ''
			formData.eitaaChatId = form?.eitaaChatId || ''
			formData.aiKhatmReviewEnabled = form?.aiKhatmReview?.enabled ?? data.aiKhatmReview.enabled
			formData.aiKhatmReviewBaseUrl = form?.aiKhatmReview?.baseUrl || data.aiKhatmReview.baseUrl || ''
			formData.aiKhatmReviewModel = form?.aiKhatmReview?.model || data.aiKhatmReview.model || ''
			formData.aiKhatmReviewApiKey = form?.aiKhatmReview?.apiKey || ''
		},
	)

	let refreshKhatmStatusLoading = $state(false)
	async function refreshKhatmsStatus() {
		try {
			refreshKhatmStatusLoading = true
			await Khatm.refreshStatusList()
			toast('info', 'وضعیت همه ختم‌ها با موفقیت تازه‌سازی شد.')
		} catch (err) {
			toast('error', String(err))
		} finally {
			refreshKhatmStatusLoading = false
		}
	}
</script>

<svelte:head>
	<title>ختم قرآن | تنظیمات سامانه</title>
</svelte:head>

<Header title="تنظیمات سامانه" />

<div class="ui-admin-shell">
	<AdminNav />

	<section class="ui-admin-page-heading" aria-labelledby="settings-page-title">
		<span class="ui-admin-page-icon"><IconSettings /></span>
		<div>
			<span>پیکربندی و نگهداری</span>
			<h1 id="settings-page-title">تنظیمات عمومی سامانه</h1>
			<p>رفتارهای اجرایی، مسیر پشتیبانی و اعلان‌های مدیریتی را از این بخش کنترل کنید.</p>
		</div>
	</section>

	<div class="ui-admin-settings-layout">
		<form
			use:validateForm
			use:enhance={enhanceForm}
			novalidate
			class="ui-admin-settings-form"
			aria-busy={submitting}
			action=""
			method="POST"
		>
			<section class="ui-admin-settings-section" aria-labelledby="general-settings-title">
				<div class="ui-admin-settings-section-heading">
					<span><IconSupport /></span>
					<div>
						<h2 id="general-settings-title">ارتباط و نگهداری داده</h2>
						<p>نشانی پشتیبانی و بازهٔ نگهداری ختم‌های بدون فعالیت را مشخص کنید.</p>
					</div>
				</div>

				<div class="ui-admin-field">
					<label for="input-support-link" class="ui-field-label">لینک پشتیبانی</label>
					<input
						bind:value={formData.supportLink}
						class="ui-input"
						type="url"
						name="supportLink"
						dir="ltr"
						id="input-support-link"
						placeholder="https://example.com/support"
						aria-describedby="support-link-hint"
					/>
					<small id="support-link-hint" class="ui-admin-field-hint">
						این نشانی در بخش‌های پشتیبانی سامانه به کاربران نمایش داده می‌شود.
					</small>
				</div>

				<div class="ui-admin-field">
					<label for="input-stale-khatm-retention-days" class="ui-field-label">
						مهلت حذف ختم‌های آغازنشده <span class="ui-admin-required">ضروری</span>
					</label>
					<div class="ui-admin-number-field">
						<input
							bind:value={formData.staleKhatmRetentionDays}
							class="ui-input"
							type="number"
							name="staleKhatmRetentionDays"
							min="1"
							max="3650"
							step="1"
							id="input-stale-khatm-retention-days"
							data-ui-validate
							aria-describedby="retention-days-hint"
							required
						/>
						<span>روز</span>
					</div>
					<small id="retention-days-hint" class="ui-admin-field-hint">
						ختم مستقلی که در این بازه هیچ آیه‌ای از آن خوانده نشود، خودکار حذف خواهد شد.
					</small>
				</div>
			</section>

			<div class="ui-admin-form-divider" aria-hidden="true"></div>

			<section class="ui-admin-settings-section" aria-labelledby="ai-review-settings-title">
				<div class="ui-admin-settings-section-heading">
					<span class="ui-admin-settings-icon-warm"><IconPsychology /></span>
					<div>
						<h2 id="ai-review-settings-title">بررسی AI ختم‌ها</h2>
						<p>عنوان و توضیح ختم‌ها را برای راهنمایی کاربر و تأیید خودکار ختم‌های عمومی بررسی کنید.</p>
					</div>
				</div>

				<label class="ui-admin-toggle-card">
					<input class="ui-checkbox" type="checkbox" name="aiKhatmReviewEnabled" bind:checked={formData.aiKhatmReviewEnabled} />
					<span class="ui-admin-toggle-copy">
						<strong>بررسی AI فعال باشد</strong>
						<small>در صورت کندی یا خطای سرویس، ثبت ختم متوقف نمی‌شود.</small>
					</span>
					<span class="ui-admin-toggle-status">{formData.aiKhatmReviewEnabled ? 'فعال' : 'غیرفعال'}</span>
				</label>

				<div class="ui-admin-field-grid" class:ui-admin-fields-muted={!formData.aiKhatmReviewEnabled}>
					<div class="ui-admin-field">
						<label for="input-ai-review-base-url" class="ui-field-label">نشانی پایهٔ OpenAI-compatible</label>
						<input bind:value={formData.aiKhatmReviewBaseUrl} class="ui-input" type="url" name="aiKhatmReviewBaseUrl" dir="ltr" id="input-ai-review-base-url" placeholder="https://api.example.com/v1" required={formData.aiKhatmReviewEnabled} />
					</div>
					<div class="ui-admin-field">
						<label for="input-ai-review-model" class="ui-field-label">نام مدل</label>
						<input bind:value={formData.aiKhatmReviewModel} class="ui-input" type="text" name="aiKhatmReviewModel" dir="ltr" id="input-ai-review-model" placeholder="gpt-4o-mini" required={formData.aiKhatmReviewEnabled} />
					</div>
					<div class="ui-admin-field">
						<label for="input-ai-review-api-key" class="ui-field-label">کلید API</label>
						<input bind:value={formData.aiKhatmReviewApiKey} class="ui-input" type="password" name="aiKhatmReviewApiKey" autocomplete="off" dir="ltr" id="input-ai-review-api-key" required={formData.aiKhatmReviewEnabled} />
						<small class="ui-admin-field-hint">برای حفظ کلید فعلی، این مقدار را تغییر ندهید.</small>
					</div>
				</div>

				<div class="ui-admin-field">
					<button
						class="ui-btn ui-btn-outline"
						type="button"
						onclick={testAiConnection}
						disabled={aiConnectionTestLoading}
					>
						{#if aiConnectionTestLoading}<span class="ui-spinner"></span>{:else}<IconRefresh />{/if}
						{aiConnectionTestLoading ? 'در حال تست اتصال…' : 'تست اتصال AI'}
					</button>
					{#if aiConnectionTest}
						<div
							class={`ui-alert ${aiConnectionTest.type === 'success' ? 'ui-alert-success' : 'ui-alert-error'} mt-3`}
							role={aiConnectionTest.type === 'success' ? 'status' : 'alert'}
						>
							{aiConnectionTest.message}
						</div>
					{/if}
				</div>
			</section>

			<div class="ui-admin-form-divider" aria-hidden="true"></div>

			<section class="ui-admin-settings-section" aria-labelledby="notification-settings-title">
				<div class="ui-admin-settings-section-heading">
					<span class="ui-admin-settings-icon-warm"><IconNotification /></span>
					<div>
						<h2 id="notification-settings-title">اعلان‌های پیام‌رسانی</h2>
						<p>دریافت اعلان‌ها در پیام‌رسان‌ها و آماده‌سازی وب‌هوک بله را مدیریت کنید.</p>
					</div>
				</div>

				<label class="ui-admin-toggle-card">
					<input class="ui-checkbox" type="checkbox" name="eitaa" bind:checked={formData.eitaa} />
					<span class="ui-admin-toggle-copy">
						<strong>ارسال اعلان فعال باشد</strong>
						<small>برای ختم تازه یا خطای غیرمنتظره، پیام مدیریتی ارسال شود.</small>
					</span>
					<span class="ui-admin-toggle-status">{formData.eitaa ? 'فعال' : 'غیرفعال'}</span>
				</label>

				<div
					class="ui-admin-field-grid ui-admin-notification-fields"
					class:ui-admin-fields-muted={!formData.eitaa}
				>
					<div class="ui-admin-field">
						<label for="input-eitaa-token" class="ui-field-label">توکن ایتا (API Key)</label>
						<input
							bind:value={formData.eitaaToken}
							class="ui-input"
							type="password"
							autocomplete="off"
							name="eitaaToken"
							dir="ltr"
							id="input-eitaa-token"
							data-ui-validate
							required={formData.eitaa}
						/>
						<small class="ui-admin-field-hint">
							توکن را از منوی API در
							<a class="ui-link" href="https://eitaayar.ir" target="_blank" rel="noreferrer"
								>ایتایار</a
							>
							دریافت کنید.
						</small>
					</div>

					<div class="ui-admin-field">
						<label for="input-eitaa-chat-id" class="ui-field-label">شناسه گفتگو (Chat ID)</label>
						<input
							bind:value={formData.eitaaChatId}
							class="ui-input"
							type="text"
							autocomplete="off"
							name="eitaaChatId"
							inputmode="numeric"
							dir="ltr"
							id="input-eitaa-chat-id"
							data-ui-validate
							required={formData.eitaa}
						/>
						<small class="ui-admin-field-hint">
							کانال یا گروه را در پنل ایتایار تعریف کنید تا شناسه در اختیارتان قرار گیرد.
						</small>
					</div>
				</div>

				<div class="ui-admin-field">
					<button
						class="ui-btn ui-btn-outline"
						type="button"
						onclick={setBaleWebhook}
						disabled={baleWebhookLoading}
					>
						{#if baleWebhookLoading}<span class="ui-spinner"></span>{:else}<IconRefresh />{/if}
						{baleWebhookLoading ? 'در حال بررسی و تنظیم…' : 'بررسی و تنظیم وب‌هوک بله'}
					</button>
					<small class="ui-admin-field-hint">
						وب‌هوک با توکن و secret تنظیم‌شده در متغیرهای محیطی سامانه ثبت می‌شود.
					</small>
					{#if baleWebhookResult}
						<div
							class={`ui-alert ${baleWebhookResult.type === 'success' ? 'ui-alert-success' : 'ui-alert-error'} mt-3`}
							role={baleWebhookResult.type === 'success' ? 'status' : 'alert'}
						>
							{baleWebhookResult.message}
						</div>
					{/if}
				</div>
			</section>

			<div class="ui-admin-settings-actions">
				<div>
					<IconInfo />
					<span>تغییرات پس از ذخیره روی سامانه اعمال می‌شوند.</span>
				</div>
				<button type="submit" class="ui-btn ui-btn-primary ui-btn-lg" disabled={submitting}>
					{#if submitting}<span class="ui-spinner"></span>{:else}<IconSave />{/if}
					{submitting ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
				</button>
			</div>
		</form>

		<aside class="ui-admin-maintenance-card">
			<span class="ui-admin-maintenance-icon"><IconCleanup /></span>
			<span class="ui-admin-eyebrow">ابزار نگهداری</span>
			<h2>تازه‌سازی وضعیت ختم‌ها</h2>
			<p>
				وضعیت همه ختم‌ها دوباره محاسبه می‌شود و موارد کامل‌شده‌ای که ثبت نشده‌اند، اصلاح خواهند شد.
			</p>
			<div class="ui-admin-maintenance-warning">
				این عملیات ممکن است کمی زمان ببرد. تا پایان پردازش، صفحه را نبندید.
			</div>
			<button
				disabled={refreshKhatmStatusLoading}
				class="ui-btn ui-btn-outline ui-btn-block"
				type="button"
				onclick={refreshKhatmsStatus}
			>
				{#if refreshKhatmStatusLoading}<span class="ui-spinner"></span>{:else}<IconRefresh />{/if}
				{refreshKhatmStatusLoading ? 'در حال تازه‌سازی…' : 'تازه‌سازی همه ختم‌ها'}
			</button>
		</aside>
	</div>
</div>
