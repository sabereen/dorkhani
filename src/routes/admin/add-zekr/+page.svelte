<script lang="ts">
	import { enhance } from '$app/forms'
	import { validateForm } from '$lib/actions/validateForm'
	import AdminNav from '$lib/components/AdminNav.svelte'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import type { SubmitFunction } from '@sveltejs/kit'
	import type { PageProps } from './$types'
	import SucessResult from './sucess-result.svelte'
	import IconAdd from '~icons/ic/round-add'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'
	import IconGroups from '~icons/ic/round-groups'
	import IconShowcase from '~icons/ic/baseline-storefront'

	let { form }: PageProps = $props()
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
	})
</script>

<PageTitle title="ساخت ختم ذکر گروهی" />

<Header title="افزودن ختم ذکر" />

<div class="ui-admin-shell">
	<AdminNav />

	{#if !form || !form.zekr}
		<section class="ui-admin-page-heading" aria-labelledby="add-zekr-title">
			<span class="ui-admin-page-icon ui-admin-page-icon-warm"><IconShowcase /></span>
			<div>
				<span>ساخت محتوای تازه</span>
				<h1 id="add-zekr-title">یک ختم ذکر گروهی بسازید</h1>
				<p>مشخصات ختم را وارد کنید؛ پس از ساخت، لینک آمادهٔ اشتراک‌گذاری خواهد بود.</p>
			</div>
		</section>

		<div class="ui-admin-form-layout">
			<form
				use:validateForm
				use:enhance={enhanceForm}
				novalidate
				class="ui-admin-form-card"
				aria-busy={submitting}
				action=""
				method="POST"
			>
				<div class="ui-admin-form-heading">
					<span class="ui-admin-form-step">۱</span>
					<div>
						<h2>اطلاعات ختم</h2>
						<p>عنوان تنها فیلد اجباری است؛ جزئیات بیشتر به مخاطب برای مشارکت کمک می‌کند.</p>
					</div>
				</div>

				<div class="ui-admin-field">
					<label for="input-title" class="ui-field-label">
						عنوان ختم <span class="ui-admin-required">ضروری</span>
					</label>
					<input
						class="ui-input"
						type="text"
						name="title"
						id="input-title"
						maxlength="100"
						placeholder="مثلاً هزار صلوات برای سلامتی بیماران"
						autocomplete="off"
						required
					/>
					<small class="ui-admin-field-hint">یک عنوان کوتاه، روشن و دعوت‌کننده بنویسید.</small>
				</div>

				<div class="ui-admin-field">
					<label for="input-description" class="ui-field-label">توضیحات</label>
					<textarea
						class="ui-textarea"
						name="description"
						id="input-description"
						maxlength="65535"
						rows="4"
						placeholder="هدف ختم و هر توضیحی که مشارکت‌کنندگان باید بدانند…"
					></textarea>
				</div>

				<div class="ui-admin-form-divider" aria-hidden="true"></div>

				<div class="ui-admin-form-heading ui-admin-form-heading-compact">
					<span class="ui-admin-form-step"><IconAutoAwesome /></span>
					<div>
						<h2>جزئیات شمارش</h2>
						<p>در صورت نیاز متن ذکر و تعداد هدف را مشخص کنید.</p>
					</div>
				</div>

				<div class="ui-admin-field-grid">
					<div class="ui-admin-field">
						<label for="input-zekr" class="ui-field-label">متن ذکر</label>
						<textarea
							class="ui-textarea"
							name="zekrText"
							id="input-zekr"
							maxlength="65535"
							rows="3"
							placeholder="مثلاً اللهم صل علی محمد و آل محمد"
						></textarea>
					</div>

					<div class="ui-admin-field">
						<label for="input-target-count" class="ui-field-label">تعداد هدف</label>
						<input
							class="ui-input"
							dir="ltr"
							type="number"
							name="targetCount"
							id="input-target-count"
							step="1"
							min="1"
							placeholder="مثلاً 1000"
						/>
						<small class="ui-admin-field-hint">اگر خالی بماند، ختم بدون سقف خواهد بود.</small>
					</div>
				</div>

				<div class="ui-admin-form-actions">
					<p>پس از ساخت، امکان بازکردن، کپی و اشتراک‌گذاری لینک را دارید.</p>
					<button class="ui-btn ui-btn-primary ui-btn-lg" type="submit" disabled={submitting}>
						{#if submitting}<span class="ui-spinner"></span>{:else}<IconAdd />{/if}
						{submitting ? 'در حال ساخت…' : 'ساخت ختم ذکر'}
					</button>
				</div>
			</form>

			<aside class="ui-admin-side-card">
				<span class="ui-admin-side-card-icon"><IconGroups /></span>
				<h2>برای مشارکت بهتر</h2>
				<p>عنوان و توضیح خوب، هدف ختم را برای مخاطب شفاف می‌کند و احتمال همراهی را بالا می‌برد.</p>
				<ul>
					<li>عنوان را کوتاه و مشخص انتخاب کنید.</li>
					<li>اگر هدف عددی دارید، تعداد دقیق را وارد کنید.</li>
					<li>پیش از انتشار، لینک نهایی را یک‌بار باز کنید.</li>
				</ul>
			</aside>
		</div>
	{:else}
		<SucessResult zekr={Zekr.fromPlain(form.zekr)} />
	{/if}
</div>
