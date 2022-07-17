<script lang="ts">
	import { goto } from '$app/navigation';

	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import StatusBox from '../status-box.svelte';

	let selectedAction: AppSideBarSelection;

	onMount(async () => {
		if ($page.routeId == 'albums') {
			selectedAction = AppSideBarSelection.ALBUMS;
		} else if ($page.routeId == 'photos') {
			selectedAction = AppSideBarSelection.PHOTOS;
		} else if ($page.routeId == 'sharing') {
			selectedAction = AppSideBarSelection.SHARING;
		}
	});
</script>

<section id="sidebar" class="flex flex-col gap-1 pt-8 pr-6">
	<a sveltekit:prefetch href={$page.routeId != 'photos' ? `/photos` : null}>
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			actionType={AppSideBarSelection.PHOTOS}
			isSelected={selectedAction === AppSideBarSelection.PHOTOS}
		/></a
	>
	<a sveltekit:prefetch href={$page.routeId != 'sharing' ? `/sharing` : null}>
		<SideBarButton
			title="Sharing"
			logo={AccountMultipleOutline}
			actionType={AppSideBarSelection.SHARING}
			isSelected={selectedAction === AppSideBarSelection.SHARING}
		/></a
	>
	<div class="text-xs ml-5 my-4">
		<p>LIBRARY</p>
	</div>
	<a sveltekit:prefetch href={$page.routeId != 'albums' ? `/albums` : null}>
		<SideBarButton
			title="Albums"
			logo={ImageAlbum}
			actionType={AppSideBarSelection.ALBUMS}
			isSelected={selectedAction === AppSideBarSelection.ALBUMS}
		/>
	</a>
	<!-- Status Box -->

	<div class="mb-6 mt-auto">
		<StatusBox />
	</div>
</section>
