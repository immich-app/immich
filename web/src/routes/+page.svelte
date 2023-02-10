<script lang="ts">
	import { goto } from '$app/navigation';
	import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
</script>

<section class="h-screen w-screen flex place-items-center place-content-center">
	<div class="flex flex-col place-items-center gap-8 text-center max-w-[350px]">
		<div class="flex place-items-center place-content-center ">
			<ImmichLogo class="text-center" height="200" width="200" />
		</div>
		<h1
			class="text-4xl text-immich-primary dark:text-immich-dark-primary font-bold font-immich-title"
		>
			Welcome to IMMICH Web
		</h1>
		<button
			class="border px-4 py-4 rounded-md bg-immich-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray dark:border-immich-dark-gray hover:bg-immich-primary/75 text-white font-bold w-[200px]"
			on:click={() => goto('/auth/login')}
			>Getting Started
		</button>
	</div>
</section>
