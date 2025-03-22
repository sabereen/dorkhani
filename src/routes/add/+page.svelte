<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'

	let { data, form }: PageProps = $props()
</script>

<Header title="ایجاد ختم گروهی جدید" />

{#if !form}
	<form use:enhance class="flex justify-center p-2" action="" method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
			<legend class="fieldset-legend">ختم قرآن</legend>

			<label for="input-title" class="fieldset-label">عنوان</label>
			<input class="input" type="text" name="title" id="input-title" />

			<label for="input-description" class="fieldset-label">توضیحات</label>
			<input class="input" type="text" name="description" id="input-description" />

			<input class="btn btn-primary mt-4" type="submit" value="ایجاد" />
		</fieldset>
	</form>
{:else}
	<div class="alert alert-success">
		ختم «{form.khatm.title}» ایجاد شد.
		<a href={`/khatm/${form.khatm.id}`} class="link block"
			>{location.origin}/khatm/{form.khatm.id}</a
		>
	</div>
{/if}
