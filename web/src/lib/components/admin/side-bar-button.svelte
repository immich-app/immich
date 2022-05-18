<script lang="ts">
	export let title: string;
	export let logo: any;
	export let actionType: AdminSideBarSelection;
	export let isSelected: boolean;

	import { createEventDispatcher } from 'svelte';
	import type { AdminSideBarSelection } from '../../models/admin-sidebar-selection';

	const dispatch = createEventDispatcher();

	const onButtonClicked = () => {
		dispatch('selected', {
			actionType,
		});
	};
</script>

<div
	on:click={onButtonClicked}
	class={`flex gap-4 place-items-center pl-5 py-3 rounded-tr-xl rounded-br-xl hover:bg-gray-200 hover:text-immich-primary hover:cursor-pointer
    ${isSelected && 'bg-immich-primary text-gray-100 hover:bg-immich-primary'}
  `}
>
	<svelte:component this={logo} size="24" />
	<p class="font-medium text-sm">{title}</p>
</div>
