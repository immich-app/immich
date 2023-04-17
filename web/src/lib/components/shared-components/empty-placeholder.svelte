<script lang="ts">
	import empty1Url from '$lib/assets/empty-1.svg';

	export let actionHandler: undefined | (() => Promise<void>) = undefined;
	export let text = '';
	export let alt = '';

	let hoverClasses =
		'hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 hover:cursor-pointer';
</script>

{#if actionHandler}
	<div
		on:click={actionHandler}
		on:keydown={actionHandler}
		class="border dark:border-immich-dark-gray {hoverClasses} p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center"
	>
		<img src={empty1Url} {alt} width="500" draggable="false" />
		<p class="text-center text-immich-text-gray-500 dark:text-immich-dark-fg">{text}</p>
	</div>
{:else}
	<div
		class="border dark:border-immich-dark-gray p-5 w-[50%] m-auto mt-10 bg-gray-50 dark:bg-immich-dark-gray rounded-3xl flex flex-col place-content-center place-items-center"
	>
		<img src={empty1Url} {alt} width="500" draggable="false" />
		<p class="text-center text-immich-text-gray-500 dark:text-immich-dark-fg">{text}</p>
	</div>
{/if}
