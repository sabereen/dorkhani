<script lang="ts">
	import { PickedKhatmPart } from '$lib/entity/PickedKhatmPart'
	import { onMount, type Snippet } from 'svelte'
	import { slide } from 'svelte/transition'
	import IconEye from '~icons/ic/outline-remove-red-eye'

	type Props = {
		/** حداکثر چند آیتم رندر شود؟ */
		limit?: number
		title?: string
		fallback?: Snippet
	}

	const props: Props = $props()

	let loading = $state(true)
	let hasMore = $state(false)

	let history = $state<PickedKhatmPart[]>()
	onMount(async () => {
		const limit = props.limit ? props.limit + 1 : undefined
		const list = await PickedKhatmPart.getList(limit)
		loading = false
		if (props.limit && list.length > props.limit) {
			list.length = props.limit
			hasMore = true
		}
		history = list
	})
</script>

{#if history?.length}
	<section transition:slide={{ axis: 'y' }} class="card card-border bg-base-100">
		<div class="card-body">
			{#if props.title}
				<h2 class="card-title">{props.title}</h2>
			{/if}
			<ul class="list">
				{#each history as item}
					<li class="list-row flex flex-col">
						<span>
							<strong>بازه:</strong>
							{item.range.getTitle()}
							<a
								class="btn btn-circle btn-ghost btn-xs ms-1"
								target="_blank"
								href={'https://ketabmobin.com/ayah/' + item.range.start}
							>
								<IconEye />
							</a>
						</span>
						<span>
							<strong>ختم:</strong>
							«<a class="link link-info" href={'/khatm/' + item.khatm.id}>{item.khatm.title}</a>»
						</span>
						<span>
							<strong>تاریخ:</strong>
							{item.date.toLocaleString('fa-IR')}
						</span>
					</li>
				{/each}
				{#if hasMore}
					<li class="list-row">
						<a class="btn btn-primary btn-outline" href="/history">نمایش همه‌ی موارد...</a>
					</li>
				{/if}
			</ul>
		</div>
	</section>
{:else if !loading}
	{@render props.fallback?.()}
{/if}
