<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import type { RangeType } from '@prisma/client'
	import { slide } from 'svelte/transition'

	let { data, form }: PageProps = $props()

	let rangeType = $state<RangeType>('free')
</script>

<Header title="ایجاد ختم گروهی جدید" />

{#if !form}
	<form use:enhance class="flex justify-center p-2" action="" method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
			<legend class="fieldset-legend">
				ختم قرآن
				{#if data.rangeType === 'ayah'}
					<span class="badge badge-info badge-xs">آیه به آیه</span>
				{/if}
			</legend>

			<label for="input-title" class="fieldset-label">عنوان</label>
			<input class="input" type="text" name="title" id="input-title" />

			<label for="input-description" class="fieldset-label">توضیحات</label>
			<input class="input" type="text" name="description" id="input-description" />

			{#if data.rangeType === 'ayah'}
				<input type="hidden" name="rangeType" value="ayah" />
			{:else}
				<label for="input-range-type" class="fieldset-label">بازه بندی</label>
				<select id="input-range-type" class="select" name="rangeType" bind:value={rangeType}>
					<option value="free">آزاد</option>
					<option value="page">صفحه به صفحه</option>
					<option value="hizbQuarter">جزء و حزب</option>
					<option value="surah">سوره به سوره</option>
					<!-- <option value="juz">جزء به جزء</option> -->
					<option value="ayah">آیه به آیه</option>
				</select>
				{#if rangeType === 'free'}
					<p class="pt-1 text-xs" transition:slide={{ axis: 'y' }}>
						در حالت «<strong>آزاد</strong>» مشارکت کننده به دلخواه خود می‌تواند یک صفحه، سوره، حزب
						یا جزء خوانده نشده را بخواند.
					</p>
				{/if}
				{#if rangeType === 'ayah'}
					<p class="pt-1 text-xs" transition:slide={{ axis: 'y' }}>
						در حالت «<strong>آیه به آیه</strong>» سیستم به صورت خودکار یک آیه از ختم را به مشارکت
						کننده نمایش می‌دهد تا آن را قرائت کند.
					</p>
				{/if}
			{/if}

			<input class="btn btn-primary mt-4" type="submit" value="ایجاد" />
		</fieldset>
	</form>
{:else}
	<div class="alert alert-success">
		ختم «{form.khatm.title}» ایجاد شد.
		<a href={`/khatm/${form.khatm.id}`} class="link block">
			{location.origin}/khatm/{form.khatm.id}
		</a>
	</div>
{/if}
