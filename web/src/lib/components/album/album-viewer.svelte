<script lang="ts">
	import { AlbumResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';

	export let album: AlbumResponseDto;

	const dispatch = createEventDispatcher();
</script>

<section class="absolute w-screen h-screen top-0 left-0 overflow-auto bg-immich-bg/75 z-[9999]">
	<button on:click={() => dispatch('back')}>Back</button>
	{album.albumName}
</section>
