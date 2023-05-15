<script lang="ts">
	import { clickOutside } from '../../utils/click-outside';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
</script>

<section
	in:fade={{ duration: 100 }}
	out:fade={{ duration: 100 }}
	class="absolute left-0 top-0 w-full h-full bg-black/40 z-[990] flex place-items-center place-content-center"
>
	<div class="z-[9999]" use:clickOutside on:outclick={() => dispatch('clickOutside')}>
		<slot />
	</div>
</section>
