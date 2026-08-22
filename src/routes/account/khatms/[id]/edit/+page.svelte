<script lang="ts">
	import { base } from '$app/paths'
	import { validateForm } from '$lib/actions/validateForm'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import type { PageProps } from './$types'
	import { apiRequest } from '$lib/utility/request'
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { KhatmData } from '$lib/contracts/domain'

	const { data }: PageProps = $props()
	let errorMessage = $state('')
	let submitting = $state(false)
	const apiPath = $derived(
		`/account/khatms/${data.khatm.id}${data.isAdmin ? '?admin=1' : ''}`,
	)

	async function save(event: SubmitEvent) {
		event.preventDefault()
		submitting = true
		errorMessage = ''
		const form = new FormData(event.currentTarget as HTMLFormElement)
		try {
			const result = await apiRequest<{ khatm: KhatmData }>('PUT', apiPath, {
				origin: location.origin,
				body: {
					title: String(form.get('title') || ''),
					description: String(form.get('description') || ''),
					rangeType: String(form.get('rangeType') || ''),
					private: form.get('access') === 'private',
					disableSeries: form.get('disableSeries') === 'on',
				},
			})
			if (data.isAdmin) {
				const link = new URL(Khatm.fromPlain(result.khatm).link)
				link.searchParams.set('admin', '1')
				await goto(link.href)
			} else {
				await goto(localizeHref(`${base}/account`))
			}
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'ذخیره تغییرات ناموفق بود.'
		} finally {
			submitting = false
		}
	}

	async function remove(event: SubmitEvent) {
		event.preventDefault()
		if (!confirm('این ختم و همه مشارکت‌های آن حذف شود؟')) return
		submitting = true
		errorMessage = ''
		try {
			await apiRequest('DELETE', apiPath, { origin: location.origin })
			await goto(data.isAdmin ? `${base}/admin/review` : localizeHref(`${base}/account`))
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'حذف ختم ناموفق بود.'
		} finally {
			submitting = false
		}
	}
</script>

<PageTitle title="ویرایش ختم" />

<Header title="ویرایش ختم" />

<div class="ui-form-status-slot mx-auto max-w-md" aria-live="polite">
	{#if errorMessage}<div class="ui-alert ui-alert-error">{errorMessage}</div>{/if}
</div>

<form use:validateForm novalidate class="mx-auto max-w-md" aria-busy={submitting} onsubmit={save}>
	<fieldset class="ui-card ui-card-bordered">
		<div class="ui-card-body grid gap-3">
			<label class="grid gap-1"
				>عنوان<input
					class="ui-input"
					name="title"
					maxlength="100"
					required
					value={data.khatm.title}
				/></label
			>
			<label class="grid gap-1"
				>توضیحات<textarea class="ui-textarea" name="description" maxlength="65535"
					>{data.khatm.description}</textarea
				></label
			>
			<label class="grid gap-1">
				نوع بازه
				<select class="ui-select" name="rangeType" disabled={!data.canChangeRange}>
					<option value="free" selected={data.khatm.rangeType === 'free'}>آزاد</option>
					<option value="page" selected={data.khatm.rangeType === 'page'}>صفحه به صفحه</option>
					<option value="hizbQuarter" selected={data.khatm.rangeType === 'hizbQuarter'}
						>حزب به حزب</option
					>
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
			<button class="ui-btn ui-btn-primary" type="submit" disabled={submitting}>ذخیره تغییرات</button>
		</div>
	</fieldset>
</form>

<form
	use:validateForm
	novalidate
	class="mx-auto mt-4 max-w-md"
	onsubmit={remove}
>
	<button class="ui-btn ui-btn-danger ui-btn-block" type="submit" disabled={submitting}>حذف ختم</button>
</form>
