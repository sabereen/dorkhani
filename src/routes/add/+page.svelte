<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import type { RangeType } from '@prisma/client'
	import { slide } from 'svelte/transition'
	import { toast } from '$lib/components/TheToast.svelte'
	import SucessResult from './sucess-result.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'

	let { data, form }: PageProps = $props()

	let rangeType = $state<RangeType>('free')

	$effect(() => {
		if (form?.errorMessage) toast('error', form.errorMessage)
	})
</script>

<svelte:head>
	<title>ختم قرآن | ایجاد ختم گروهی جدید</title>
</svelte:head>

<Header title="ایجاد ختم گروهی جدید" />

{#if !form || !form.khatm}
	<form use:enhance class="flex justify-center p-2" action="" method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border px-4 !pb-4">
			<legend class="fieldset-legend">
				ختم قرآن
				{#if data.rangeType === 'ayah'}
					<span class="badge badge-info badge-xs ms-1">آیه به آیه</span>
				{/if}
			</legend>

			<label for="input-title" class="fieldset-label mt-2">عنوان</label>
			<input class="input" type="text" name="title" id="input-title" maxlength="100" />

			<label for="input-description" class="fieldset-label mt-2">توضیحات</label>
			<textarea class="textarea" name="description" id="input-description" maxlength="65535"
			></textarea>

			{#if data.rangeType === 'ayah'}
				<input type="hidden" name="rangeType" value="ayah" />
			{:else}
				<label for="input-range-type" class="fieldset-label mt-2">بازه بندی</label>
				<select id="input-range-type" class="select" name="rangeType" bind:value={rangeType}>
					<option value="free">آزاد</option>
					<option value="page">صفحه به صفحه</option>
					<option value="hizbQuarter">حزب به حزب (¼)</option>
					<option value="surah">سوره به سوره</option>
					<option value="juz">جزء به جزء</option>
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

			<div class="bg-base-200 mt-2 flex flex-col">
				{#snippet radioItem(value: 'public' | 'private', title: string, description: string)}
					<label class="flex items-center py-1">
						<input class="radio" type="radio" name="access" {value} checked={value === 'public'} />
						<span class="ms-2 flex min-w-0 grow basis-0 flex-col">
							<span class="text-[.9rem] font-bold">{title}</span>
							<span class="text-xs">{description}</span>
						</span>
					</label>
				{/snippet}
				{@render radioItem(
					'public',
					'عمومی',
					'لینک ختم کوتاه‌تر است و در صورت تأیید مدیر در صفحه اصلی نمایش داده می‌شود.',
				)}
				{@render radioItem(
					'private',
					'خصوصی',
					'لینک ختم بلندتر است و هرگز در صفحه اصلی سایت نمایش داده نمی‌شود.',
				)}
			</div>

			<input class="btn btn-primary mt-3" type="submit" value="ایجاد" />
		</fieldset>
	</form>
{:else}
	<div class="mt-4">
		<SucessResult khatm={Khatm.fromPlain(form.khatm)} />
	</div>
{/if}
