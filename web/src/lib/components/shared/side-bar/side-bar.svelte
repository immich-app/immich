<script lang="ts">
	import { goto } from '$app/navigation';

	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import SideBarButton from './side-bar-button.svelte';
	import StatusBox from '../status-box.svelte';

	let selectedAction: AppSideBarSelection;

	const onSidebarButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AppSideBarSelection;

		if (selectedAction == AppSideBarSelection.PHOTOS) {
			if ($page.routeId != 'photos') {
				goto('/photos');
			}
		}

		if (selectedAction == AppSideBarSelection.ALBUMS) {
			if ($page.routeId != 'albums') {
				goto('/albums');
			}
		}
	};

	onMount(async () => {
		if ($page.routeId == 'albums') {
			selectedAction = AppSideBarSelection.ALBUMS;
		} else if ($page.routeId == 'photos') {
			selectedAction = AppSideBarSelection.PHOTOS;
		}
	});
</script>

<section id="sidebar" class="flex flex-col gap-4 pt-8 pr-6">
	<a sveltekit:prefetch href={$page.routeId != 'photos' ? `/photos` : null}>
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			actionType={AppSideBarSelection.PHOTOS}
			isSelected={selectedAction === AppSideBarSelection.PHOTOS}
		/></a
	>

	<div class="text-xs ml-5">
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
