<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { publicWebUrl } from '$lib/config/runtime'
</script>

<PageTitle title="مدیریت سامانه" />
<Header title="مدیریت سامانه" />

<section class="ui-card ui-card-bordered mx-auto mt-4 max-w-md">
	<div class="ui-card-body">
		<h2 class="ui-card-title">مدیریت فقط در نسخه وب</h2>
		<p class="ui-text-muted">برای استفاده از ابزارهای مدیریت، نسخه وب سامانه را باز کنید.</p>
		<div class="ui-card-actions">
			<a class="ui-btn ui-btn-primary" href={publicWebUrl('/admin')}>بازکردن نسخه وب</a>
		</div>
	</div>
</section>
