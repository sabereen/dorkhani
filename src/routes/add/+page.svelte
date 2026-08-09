<script lang="ts">
	import type { PageProps } from './$types'
	import { enhance } from '$app/forms'
	import Header from '$lib/components/Header.svelte'
	import type { RangeType } from '@prisma-client'
	import { slide } from 'svelte/transition'
	import { toast } from '$lib/components/TheToast.svelte'
	import SucessResult from './sucess-result.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'

	let { data, form }: PageProps = $props()

	let rangeType = $state<RangeType>('free')

	$effect(() => {
		if (form?.errorMessage) toast('error', form.errorMessage)
	})

	function handleKeyPress(event: KeyboardEvent) {
		if (event.code === 'Enter') {
			event.preventDefault()
		}
	}
</script>

<svelte:head>
	<title>ختم قرآن | ایجاد ختم گروهی جدید</title>
</svelte:head>

<Header title="ایجاد ختم گروهی جدید" />

{#if !form || !form.khatm}
	<form use:enhance class="flex justify-center p-2" action="" method="POST">
		<fieldset class="ui-fieldset max-w-lg">
			<legend class="ui-fieldset-legend">
				ختم قرآن
				{#if data.rangeType === 'ayah'}
					<span class="ui-badge ui-badge-info ui-badge-xs mr-1">آیه به آیه</span>
				{/if}
			</legend>

			<label for="input-title" class="ui-field-label">عنوان</label>
			<input
				class="ui-input"
				type="text"
				name="title"
				id="input-title"
				maxlength="100"
				onkeypress={handleKeyPress}
			/>

			<label for="input-description" class="ui-field-label">توضیحات</label>
			<textarea class="ui-textarea" name="description" id="input-description" maxlength="65535"
			></textarea>

			{#if data.rangeType === 'ayah'}
				<input type="hidden" name="rangeType" value="ayah" />
			{:else}
				<label for="input-range-type" class="ui-field-label">بازه بندی</label>
				<select id="input-range-type" class="ui-select" name="rangeType" bind:value={rangeType}>
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

			<div class="ui-bg-surface mt-2 flex select-none flex-col rounded-lg px-2 py-1">
				{#snippet radioItem(value: 'public' | 'private', title: string, description: string)}
					<label class="flex items-center py-1">
						<input class="ui-radio" type="radio" name="access" {value} checked={value === 'private'} />
						<span class="mr-2 flex min-w-0 grow basis-0 flex-col">
							<span class="text-[.9rem] font-bold">{title}</span>
							<span class="text-xs">{description}</span>
						</span>
					</label>
				{/snippet}
				{@render radioItem(
					'private',
					'خصوصی',
					'لینک ختم بلندتر است و هرگز در صفحه اصلی سایت نمایش داده نمی‌شود.',
				)}
				{@render radioItem(
					'public',
					'عمومی',
					'لینک ختم کوتاه‌تر است و در صورت تأیید مدیر در صفحه اصلی نمایش داده می‌شود.',
				)}
			</div>

			<label
				class="ui-bg-surface mt-2 flex cursor-pointer select-none items-center rounded-lg px-2 py-2"
			>
				<input class="ui-checkbox" type="checkbox" name="series" />
				<span class="mr-2 flex min-w-0 grow basis-0 flex-col">
					<span class="text-[.9rem] font-bold">تمام نشدنی!</span>
					<p class="text-xs">
						در صورت فعال کردن این گزینه، پس از پایان ختم، یک دور ختم جدید به صورت خودکار آغاز
						می‌گردد.
					</p>
				</span>
			</label>

			<input class="ui-btn ui-btn-primary mt-3" type="submit" value="ایجاد" />
		</fieldset>
	</form>
{:else}
	<div class="mt-4">
		<SucessResult khatm={Khatm.fromPlain(form.khatm)} />
	</div>
{/if}
