<script lang="ts">
	import { page } from '$app/state'
</script>

<div class="hero mt-7">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="text-5xl font-black">{page.status}</h1>
			<p class="py-6">
				{page.error?.message || 'خطایی رخ داده است.'}
			</p>
			<a class="btn btn-primary btn-outline font-bold" href="/">صفحه اصلی</a>
		</div>
	</div>
</div>
