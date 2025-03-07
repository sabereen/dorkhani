<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'

	let { data, form }: PageProps = $props()
</script>

<h1 class="mb-5 text-3xl">تعریف ختم جدید</h1>

{#if !form}
	<form use:enhance action="" method="POST">
		<div>
			<input class="input" placeholder="عنوان" type="text" name="title" id="input-title" />
		</div>
		<div>
			<input
				class="input mt-2"
				type="text"
				placeholder="توضیحات"
				name="description"
				id="input-description"
			/>
		</div>

		<input class="btn btn-primary mt-2" type="submit" value="ایجاد" />
	</form>
{:else}
	<div class="alert alert-success">
		ختم «{form.khatm.title}» ایجاد شد.
		<a href={`/khatm/${form.khatm.id}`} class="link block"
			>{location.origin}/khatm/{form.khatm.id}</a
		>
	</div>
{/if}
