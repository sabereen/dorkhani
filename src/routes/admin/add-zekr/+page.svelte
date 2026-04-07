<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import SucessResult from './sucess-result.svelte'
	import { Zekr } from '$lib/entity/Zekr.svelte'

	let { form }: PageProps = $props()

	$effect(() => {
		if (form?.errorMessage) toast('error', form.errorMessage)
	})
</script>

<svelte:head>
	<title>ختم ذکر | ایجاد ختم گروهی جدید</title>
</svelte:head>

<Header title="ایجاد ختم ذکر گروهی" />

{#if !form || !form.zekr}
	<form use:enhance class="flex justify-center p-2" action="" method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border px-4 !pb-4">
			<legend class="fieldset-legend"> ختم اذکار </legend>

			<label for="input-title" class="fieldset-label mt-2">عنوان</label>
			<input class="input" type="text" name="title" id="input-title" maxlength="100" />

			<label for="input-description" class="fieldset-label mt-2">توضیحات</label>
			<textarea class="textarea" name="description" id="input-description" maxlength="65535"
			></textarea>

			<label for="input-zekr" class="fieldset-label mt-2">متن ذکر (اختیاری)</label>
			<textarea class="textarea" name="zekrText" id="input-zekr" maxlength="65535"></textarea>

			<label for="input-target-count" class="fieldset-label mt-2">تعداد هدف (اختیاری)</label>
			<input
				class="input"
				dir="ltr"
				type="number"
				name="targetCount"
				id="input-target-count"
				step="1"
				min="1"
			/>

			<input class="btn btn-primary mt-3" type="submit" value="ایجاد" />
		</fieldset>
	</form>
{:else}
	<div class="mt-4">
		<SucessResult zekr={Zekr.fromPlain(form.zekr)} />
	</div>
{/if}
