<script lang="ts">
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()

	const formData = $state({
		supportLink: data.supportLink,
	})

	watch(
		() => form,
		() => {
			toast('info', 'تنظیمات ذخیره شد.')
			formData.supportLink = form?.supportLink || ''
		},
	)
</script>

<svelte:head>
	<title>ختم قرآن | تنیمات کلی سایت</title>
</svelte:head>

<Header title="مدیریت تنظیات کلی" />

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

		<button type="submit" class="btn btn-primary mt-3">ذخیره</button>
	</fieldset>
</form>
