<script lang="ts">
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()

	const formData = $state({
		supportLink: data.supportLink,
		autoShowcase: data.autoShowcase,
	})

	watch(
		() => form,
		() => {
			toast('info', 'تنظیمات ذخیره شد.')
			formData.supportLink = form?.supportLink || ''
			formData.autoShowcase = form?.autoShowcase
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
			<input
				class="checkbox"
				type="checkbox"
				name="autoShowcase"
				bind:checked={formData.autoShowcase}
			/>
			<span class="ms-2 flex min-w-0 grow basis-0 flex-col">
				<span class="text-[.9rem] font-bold">ویترین خودکار</span>
				<p class="text-xs">
					بدون نیاز به تأیید مدیر آخرین ختم‌های عمومی در صفحه اصلی نمایش داده شوند.
				</p>
			</span>
		</label>

		<button type="submit" class="btn btn-primary mt-3">ذخیره</button>
	</fieldset>
</form>
