<script lang="ts">
	import { base } from '$app/paths'
	import AdminNav from '$lib/components/AdminNav.svelte'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { page } from '$app/state'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconDashboard from '~icons/ic/round-home'
	import IconReview from '~icons/ic/outline-check-box'
	import IconSecurity from '~icons/ic/round-check-circle'
	import IconSettings from '~icons/ic/round-settings'
	import IconShowcase from '~icons/ic/baseline-storefront'
</script>

<PageTitle title="پیشخوان مدیریت" />

<svelte:head>
	<meta
		name="description"
		content={`پیشخوان مدیریت ${page.data.branding.name} برای بررسی ختم‌ها و تنظیم سرویس‌ها`}
	/>
</svelte:head>

<Header title="مدیریت سامانه" />

<div class="ui-admin-shell">
	<AdminNav />

	<section class="ui-admin-hero" aria-labelledby="admin-dashboard-title">
		<div class="ui-admin-hero-copy">
			<span class="ui-admin-eyebrow"><IconDashboard /> مرکز کنترل سامانه</span>
			<h1 id="admin-dashboard-title">همه‌چیز برای مدیریت، یک‌جا و روشن</h1>
			<p>
				درخواست‌های جدید را بررسی کنید، ختم ذکر بسازید و تنظیمات اجرایی سامانه را با دسترسی سریع
				مدیریت کنید.
			</p>
		</div>
		<div class="ui-admin-hero-art" aria-hidden="true">
			<span class="ui-admin-hero-ring"></span>
			<span class="ui-admin-hero-icon"><IconDashboard /></span>
			<span class="ui-admin-hero-dot ui-admin-hero-dot-one"></span>
			<span class="ui-admin-hero-dot ui-admin-hero-dot-two"></span>
		</div>
	</section>

	<section class="ui-admin-section" aria-labelledby="admin-actions-title">
		<div class="ui-admin-section-heading">
			<div>
				<span>دسترسی سریع</span>
				<h2 id="admin-actions-title">چه کاری می‌خواهید انجام دهید؟</h2>
			</div>
			<p>برای ورود به هر بخش، یکی از کارت‌ها را انتخاب کنید.</p>
		</div>

		<div class="ui-admin-action-grid">
			<a class="ui-admin-action-card ui-admin-action-card-review" href={`${base}/admin/review`}>
				<span class="ui-admin-action-icon"><IconReview /></span>
				<span class="ui-admin-action-copy">
					<strong>بررسی ختم‌ها</strong>
					<small>مشاهده، تأیید یا رد ختم‌های ثبت‌شده</small>
				</span>
				<span class="ui-admin-action-arrow" aria-hidden="true"><IconArrow /></span>
			</a>

			<a class="ui-admin-action-card ui-admin-action-card-zekr" href={`${base}/admin/add-zekr`}>
				<span class="ui-admin-action-icon"><IconShowcase /></span>
				<span class="ui-admin-action-copy">
					<strong>افزودن ختم ذکر</strong>
					<small>ساخت یک ختم ذکر تازه و دریافت لینک اشتراک</small>
				</span>
				<span class="ui-admin-action-arrow" aria-hidden="true"><IconArrow /></span>
			</a>

			<a
				class="ui-admin-action-card ui-admin-action-card-settings"
				href={`${base}/admin/app-settings`}
			>
				<span class="ui-admin-action-icon"><IconSettings /></span>
				<span class="ui-admin-action-copy">
					<strong>تنظیمات سامانه</strong>
					<small>مدیریت برندینگ، نگهداری داده‌ها، پشتیبانی و اعلان‌ها</small>
				</span>
				<span class="ui-admin-action-arrow" aria-hidden="true"><IconArrow /></span>
			</a>
		</div>
	</section>

	<aside class="ui-admin-notice">
		<span class="ui-admin-notice-icon" aria-hidden="true"><IconSecurity /></span>
		<div>
			<strong>فضای مدیریت امن است</strong>
			<p>این بخش تنها برای مدیران مجاز نمایش داده می‌شود و عملیات آن روی کل سامانه اثر دارد.</p>
		</div>
	</aside>
</div>
