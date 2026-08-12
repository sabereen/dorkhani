<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { authClient } from '$lib/auth-client'
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()
	const khatms = $derived(Khatm.fromPlainList(data.khatms))

	async function signOut() {
		await authClient.signOut()
		await invalidateAll()
		await goto(`${base}/`)
	}
</script>

<svelte:head><title>حساب من | ختم قرآن</title></svelte:head>

<Header title="حساب من" />

<section class="ui-card ui-card-bordered mt-4">
	<div class="ui-card-body flex-row items-center justify-between">
		<div>
			<h2 class="font-bold">{data.user.name}</h2>
			{#if data.user.email}<p class="text-sm opacity-70">{data.user.email}</p>{/if}
		</div>
		<button class="ui-btn ui-btn-outline" type="button" onclick={signOut}>خروج</button>
	</div>
</section>

<section class="ui-card ui-card-bordered mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">اعلان‌ها</h2>
		<p class="ui-text-muted">
			پیام‌های ساخت، انتخاب سهم و پایان ختم از نخستین کانال در دسترس فرستاده می‌شوند.
		</p>

		{#if form?.notificationSaved}
			<div class="ui-alert ui-alert-success mt-3" role="status">تنظیمات اعلان ذخیره شد.</div>
		{:else if form?.notificationError}
			<div class="ui-alert ui-alert-error mt-3" role="alert">{form.notificationError}</div>
		{/if}

		<form method="POST" action="?/notifications" class="ui-auth-form mt-4">
			<label class="ui-field-label">
				<input
					class="ui-checkbox"
					type="checkbox"
					name="enabled"
					checked={data.notificationSettings?.enabled ?? true}
				/>
				<span>اعلان‌های کاربری فعال باشد</span>
			</label>

			<fieldset class="ui-fieldset">
				<legend class="ui-fieldset-legend">کانال‌ها</legend>
				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="baleEnabled"
						checked={data.notificationSettings?.channels.bale.enabled ?? true}
					/>
					<span>بله</span>
					{#if data.notificationSettings?.channels.bale.available}
						<span class="ui-badge ui-badge-success">آماده</span>
					{:else if data.messengerLinks.bale}
						<a class="ui-link" href={data.messengerLinks.bale}>شروع گفت‌وگو</a>
					{:else}
						<span class="ui-text-muted">در دسترس نیست</span>
					{/if}
				</label>

				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="eitaaEnabled"
						checked={data.notificationSettings?.channels.eitaa.enabled ?? true}
					/>
					<span>ایتا</span>
					{#if data.notificationSettings?.channels.eitaa.available}
						<span class="ui-badge ui-badge-success">آماده</span>
					{:else if data.messengerLinks.eitaa}
						<a class="ui-link" href={data.messengerLinks.eitaa}>شروع گفت‌وگو</a>
					{:else}
						<span class="ui-text-muted">در دسترس نیست</span>
					{/if}
				</label>

				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="emailEnabled"
						checked={data.notificationSettings?.channels.email.enabled ?? true}
					/>
					<span>ایمیل</span>
					<span class="ui-text-muted">
						{data.notificationSettings?.channels.email.available
							? 'آماده'
							: 'ایمیل تأییدشده یا SMTP موجود نیست'}
					</span>
				</label>
			</fieldset>

			<div class="ui-auth-field">
				<label class="ui-field-label" for="preferred-notification-channel">کانال ترجیحی</label>
				<select
					id="preferred-notification-channel"
					class="ui-select"
					name="preferredChannel"
					value={data.notificationSettings?.preferredChannel || ''}
				>
					<option value="">اولویت پیش‌فرض: بله، ایتا، ایمیل</option>
					<option value="bale">بله</option>
					<option value="eitaa">ایتا</option>
					<option value="email">ایمیل</option>
				</select>
			</div>

			<button class="ui-btn ui-btn-primary" type="submit">ذخیره تنظیمات اعلان</button>
		</form>
	</div>
</section>

<section class="mt-6">
	<h2 class="mb-3 text-xl font-black">ختم‌های من</h2>
	{#if khatms.length === 0}
		<div class="ui-alert">هنوز ختمی به این حساب متصل نشده است.</div>
	{:else}
		<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
			{#each khatms as khatm (khatm.id)}
				<li>
					<KhatmListCard {khatm} meta={khatm.private ? 'ختم خصوصی' : 'ختم عمومی'}>
						{#snippet actions()}
							<a class="ui-btn ui-btn-ghost ui-btn-xs" href={khatm.link}>مشاهده</a>
							<a
								class="ui-btn ui-btn-primary ui-btn-xs"
								href={`${base}/account/khatms/${khatm.id}/edit`}>ویرایش</a
							>
						{/snippet}
					</KhatmListCard>
				</li>
			{/each}
		</ul>
	{/if}
</section>
