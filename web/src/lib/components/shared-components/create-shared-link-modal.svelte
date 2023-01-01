<script>
	import { createEventDispatcher } from 'svelte';
	import BaseModal from './base-modal.svelte';
	import Link from 'svelte-material-icons/Link.svelte';

	const dispatch = createEventDispatcher();
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<Link size={24} />
			<p class="font-medium text-immich-fg dark:text-immich-dark-fg">Create link to share</p>
		</span>
	</svelte:fragment>

	<section class="mx-6 mt-2 mb-8">
		<div>Let anyone with the link see photos and people in this album.</div>
	</section>

	<hr />

	<section class="m-6">
		<div class="flex justify-end">
			<button
				class="text-white bg-immich-primary px-4 py-2 rounded-lg text-sm transition-colors hover:bg-immich-primary/75"
			>
				Create Link
			</button>
		</div>
	</section>
</BaseModal>
