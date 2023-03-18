<script lang="ts">
	import ImmichLogo from './immich-logo.svelte';

	export let title: string;
	export let showMessage = $$slots.message;
</script>

<section class="min-h-screen w-screen flex place-items-center place-content-center p-4">
	<div
		class="flex flex-col gap-4 border bg-white dark:bg-immich-dark-gray dark:border-immich-dark-gray p-8 shadow-sm w-full max-w-lg rounded-3xl"
	>
		<div class="flex flex-col place-items-center place-content-center gap-4 py-4">
			<ImmichLogo class="h-24 w-24" />
			<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
				{title}
			</h1>
		</div>

		{#if showMessage}
			<div
				class="text-sm border rounded-xl p-4 text-immich-primary dark:text-immich-dark-primary font-medium bg-immich-primary/5 dark:border-immich-dark-bg w-full border-immich-primary border-2"
			>
				<slot name="message" />
			</div>
		{/if}

		<slot />
	</div>
</section>
