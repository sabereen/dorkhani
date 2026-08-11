<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import { enhance } from '$app/forms'
	import { validateForm } from '$lib/actions/validateForm'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()

	const { notification, supportLink } = /* svelte-ignore state_referenced_locally */ data

	const formData = $state({
		supportLink: supportLink,
		eitaa: notification.eitaa,
		eitaaToken: notification.eitaaToken || '',
		eitaaChatId: notification.eitaaChatId || '',
	})

	watch(
		() => form,
		() => {
			toast('info', 'تنظیمات ذخیره شد.')
			formData.supportLink = form?.supportLink || ''
			formData.eitaa = form?.eitaa
			formData.eitaaToken = form?.eitaaToken || ''
			formData.eitaaChatId = form?.eitaaChatId || ''
		},
	)

	let refreshKhatmStatusLoading = $state(false)
	async function refreshKhatmsStatus() {
		try {
			refreshKhatmStatusLoading = true
			await Khatm.refreshStatusList()
			toast('info', 'تازه سازی انجام شد.')
		} catch (err) {
			toast('error', String(err))
		} finally {
			refreshKhatmStatusLoading = false
		}
	}
</script>

<svelte:head>
	<title>ختم قرآن | تنظیمات کلی سایت</title>
</svelte:head>

<Header title="مدیریت تنظیمات کلی" />

<div class="mt-4 text-center">
	<button
		disabled={refreshKhatmStatusLoading}
		class="ui-btn ui-btn-outline"
		onclick={refreshKhatmsStatus}
	>
		تازه‌سازی وضعیت تمام ختم‌ها
	</button>
</div>

<form use:validateForm use:enhance novalidate class="mt-4 flex justify-center p-2" action="" method="POST">
	<fieldset class="ui-fieldset max-w-lg">
		<label for="input-support-link" class="ui-field-label">لینک پشتیبانی</label>
		<input
			bind:value={formData.supportLink}
			class="ui-input"
			type="url"
			name="supportLink"
			dir="ltr"
			id="input-support-link"
		/>

		<label class="ui-bg-surface mt-2 flex cursor-pointer items-center rounded-lg px-2 py-2">
			<input class="ui-checkbox" type="checkbox" name="eitaa" bind:checked={formData.eitaa} />
			<span class="mr-2 flex min-w-0 grow basis-0 flex-col">
				<span class="text-[.9rem] font-bold">نوتیفیکشن ایتا</span>
				<p class="text-xs">
					هرگاه خطایی غیر منتظره در سیستم رخ دهد یا اینکه ختم جدیدی ایجاد شود نوتیفیکیشن به ایتا
					ارسال شود.
				</p>
			</span>
		</label>

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
		<p class="text-xs">
			در پنل <a class="link" href="https://eitaayar.ir" target="_blank">eitaayar.ir</a>
			از منوی API توکن را دریافت کنید.
		</p>

		<label for="input-eitaa-chat-id" class="ui-field-label">شناسه گفتگوی ایتا (Chat ID)</label>
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
		<p class="text-xs">
			کانال یا گروه مورد نظر را در قسمت «کانال‌ها» و «افزودن کانال جدید» در پنل ایتایار تعریف کنید
			تا شناسه را در اختیارتان قرار دهد.
		</p>

		<button type="submit" class="ui-btn ui-btn-primary mt-3">ذخیره</button>
	</fieldset>
</form>
