<script lang="ts">
	import { page } from '$app/state'
	import { base } from '$app/paths'
</script>

<div class="ui-hero mt-7">
		<div class="max-w-md">
			<h1 class="text-5xl font-black">{page.status}</h1>
			<p class="text-balance py-6">
				{page.error?.message || 'خطایی رخ داده است.'}
			</p>
			<a class="ui-btn ui-btn-outline" href={`${base}/`}>صفحه اصلی</a>
		</div>
</div>
