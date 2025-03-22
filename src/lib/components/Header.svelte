<script lang="ts">
	const { title = '' } = $props()
</script>

<div class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start"></div>
	<div class="navbar-center">
		<h1 class="text-xl font-black">{title}</h1>
	</div>
	<div class="navbar-end"></div>
</div>
