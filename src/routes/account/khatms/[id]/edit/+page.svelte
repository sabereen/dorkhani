<script lang="ts">
	import { base } from '$app/paths'
	import Header from '$lib/components/Header.svelte'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()
</script>

<svelte:head><title>ویرایش ختم | ختم قرآن</title></svelte:head>

<Header title="ویرایش ختم" />

{#if form?.errorMessage}<div class="ui-alert ui-alert-error mt-4">{form.errorMessage}</div>{/if}

<form method="POST" class="mx-auto mt-4 max-w-md">
	<fieldset class="ui-card ui-card-bordered">
		<div class="ui-card-body grid gap-3">
			<label class="grid gap-1">عنوان<input class="ui-input" name="title" maxlength="100" required value={data.khatm.title} /></label>
			<label class="grid gap-1">توضیحات<textarea class="ui-textarea" name="description" maxlength="65535">{data.khatm.description}</textarea></label>
			<label class="grid gap-1">
				نوع بازه
				<select class="ui-select" name="rangeType" disabled={!data.canChangeRange}>
					<option value="free" selected={data.khatm.rangeType === 'free'}>آزاد</option>
					<option value="page" selected={data.khatm.rangeType === 'page'}>صفحه به صفحه</option>
					<option value="hizbQuarter" selected={data.khatm.rangeType === 'hizbQuarter'}>حزب به حزب</option>
					<option value="surah" selected={data.khatm.rangeType === 'surah'}>سوره به سوره</option>
					<option value="juz" selected={data.khatm.rangeType === 'juz'}>جزء به جزء</option>
					<option value="ayah" selected={data.khatm.rangeType === 'ayah'}>آیه به آیه</option>
				</select>
				{#if !data.canChangeRange}
					<input type="hidden" name="rangeType" value={data.khatm.rangeType} />
					<span class="ui-text-muted text-xs">به‌دلیل ثبت مشارکت، نوع بازه قفل شده است.</span>
				{/if}
			</label>
			<div class="grid gap-2">
				<label>
					<input
						class="ui-radio"
						type="radio"
						name="access"
						value="private"
						checked={data.khatm.private}
					/>
					خصوصی
				</label>
				<label>
					<input
						class="ui-radio"
						type="radio"
						name="access"
						value="public"
						checked={!data.khatm.private}
					/>
					عمومی
				</label>
			</div>
			{#if data.canDisableSeries}
				<label class="ui-alert ui-alert-info">
					<input class="ui-checkbox" type="checkbox" name="disableSeries" />
					دور جاری آخرین دور باشد
				</label>
			{/if}
			<button class="ui-btn ui-btn-primary" type="submit">ذخیره تغییرات</button>
		</div>
	</fieldset>
</form>

<form
	method="POST"
	action={`${base}/account/khatms/${data.khatm.id}/edit/delete`}
	class="mx-auto mt-4 max-w-md"
	onsubmit={(event) => !confirm('این ختم و همه مشارکت‌های آن حذف شود؟') && event.preventDefault()}
>
	<button class="ui-btn ui-btn-danger ui-btn-block" type="submit">حذف ختم</button>
</form>
