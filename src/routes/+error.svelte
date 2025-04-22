<script lang="ts">
	import { page } from '$app/state'
	import { base } from '$app/paths'
</script>

<div class="hero mt-7">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="text-5xl font-black">{page.status}</h1>
			<p class="py-6">
				{page.error?.message || 'خطایی رخ داده است.'}
			</p>
			<a class="btn btn-primary !btn-outline font-bold" href={`${base}/`}>صفحه اصلی</a>
		</div>
	</div>
</div>
