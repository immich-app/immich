<script lang="ts">
	export let title: string;
	// TODO: why `any` here? There should be a expected type for this
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let logo: any;
	export let actionType: AdminSideBarSelection | AppSideBarSelection;
	export let isSelected: boolean;

	import { createEventDispatcher } from 'svelte';
	import type {
		AdminSideBarSelection,
		AppSideBarSelection
	} from '../../../models/admin-sidebar-selection';

	const dispatch = createEventDispatcher();

	const onButtonClicked = () => {
		dispatch('selected', {
			actionType
		});
	};
</script>

<div
	on:click={onButtonClicked}
	class={`flex gap-4 place-items-center pl-5 py-3 rounded-tr-full rounded-br-full hover:bg-gray-200 hover:text-immich-primary hover:cursor-pointer
    ${isSelected && 'bg-immich-primary/10 text-immich-primary hover:bg-immich-primary/25'}
  `}
>
	<svelte:component this={logo} size="24" />
	<p class="font-medium text-sm">{title}</p>
</div>
