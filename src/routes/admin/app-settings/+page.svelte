<script lang="ts">
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()

	const formData = $state({
		supportLink: data.supportLink,
		eitaa: data.notification.eitaa,
		eitaaToken: data.notification.eitaaToken || '',
		eitaaChatId: data.notification.eitaaChatId || '',
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
</script>

<svelte:head>
	<title>ختم قرآن | تنظیمات کلی سایت</title>
</svelte:head>

<Header title="مدیریت تنظیمات کلی" />

<form use:enhance class="mt-4 flex justify-center p-2" action="" method="POST">
	<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border px-4 !pb-4">
		<label for="input-support-link" class="fieldset-label mt-2">لینک پشتیبانی</label>
		<input
			bind:value={formData.supportLink}
			class="input"
			type="url"
			name="supportLink"
			dir="ltr"
			id="input-support-link"
		/>

		<label class="bg-base-100 mt-2 flex cursor-pointer items-center rounded-lg px-2 py-1 py-2">
			<input class="checkbox" type="checkbox" name="eitaa" bind:checked={formData.eitaa} />
			<span class="ms-2 flex min-w-0 grow basis-0 flex-col">
				<span class="text-[.9rem] font-bold">نوتیفیکشن ایتا</span>
				<p class="text-xs">
					هرگاه خطایی غیر منتظره در سیستم رخ دهد یا اینکه ختم جدیدی ایجاد شود نوتیفیکیشن به ایتا
					ارسال شود.
				</p>
			</span>
		</label>

		<label for="input-eitaa-token" class="fieldset-label mt-2">توکن ایتا (API Key)</label>
		<input
			bind:value={formData.eitaaToken}
			class="input"
			type="password"
			autocomplete="off"
			name="eitaaToken"
			dir="ltr"
			id="input-eitaa-token"
		/>
		<p class="text-xs">
			در پنل <a class="link" href="https://eitaayar.ir" target="_blank">eitaayar.ir</a>
			از منوی API توکن را دریافت کنید.
		</p>

		<label for="input-eitaa-chat-id" class="fieldset-label mt-2">شناسه گفتگوی ایتا (Chat ID)</label>
		<input
			bind:value={formData.eitaaChatId}
			class="input"
			type="text"
			autocomplete="off"
			name="eitaaChatId"
			inputmode="numeric"
			dir="ltr"
			id="input-eitaa-chat-id"
		/>
		<p class="text-xs">
			کانال یا گروه مورد نظر را در قسمت «کانال‌ها» و «افزودن کانال جدید» در پنل ایتایار تعریف کنید
			تا شناسه را در اختیارتان قرار دهد.
		</p>

		<button type="submit" class="btn btn-primary mt-3">ذخیره</button>
	</fieldset>
</form>
