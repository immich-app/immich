<script lang="ts">
	import { clickOutside } from '../../utils/click-outside';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
</script>

<section
	in:fade={{ duration: 100 }}
	out:fade={{ duration: 100 }}
	class="absolute w-full h-full bg-black/40 z-[100] flex place-items-center place-content-center "
>
	<div class="z-[9999]" use:clickOutside on:out-click={() => dispatch('clickOutside')}>
		<slot />
	</div>
</section>
