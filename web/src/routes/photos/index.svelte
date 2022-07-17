<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import { getAssetsInfo } from '$lib/stores/assets';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		await getAssetsInfo();

		return {
			status: 200,
			props: {
				user: session.user
			}
		};
	};
</script>

<script lang="ts">
	import type { ImmichUser } from '$lib/models/immich-user';

	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import { fly } from 'svelte/transition';
	import { session } from '$app/stores';
	import { assetsGroupByDate, flattenAssetGroupByDate } from '$lib/stores/assets';
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import moment from 'moment';
	import AssetViewer from '$lib/components/asset-viewer-page/asset-viewer.svelte';
	import { fileUploader } from '$lib/utils/file-uploader';
	import { AssetResponseDto } from '@api';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';

	export let user: ImmichUser;

	let selectedGroupThumbnail: number | null;
	let isMouseOverGroup: boolean;
	$: if (isMouseOverGroup == false) {
		selectedGroupThumbnail = null;
	}

	let isShowAsset = false;
	let currentViewAssetIndex = 0;
	let currentSelectedAsset: AssetResponseDto;

	const thumbnailMouseEventHandler = (event: CustomEvent) => {
		const { selectedGroupIndex }: { selectedGroupIndex: number } = event.detail;

		selectedGroupThumbnail = selectedGroupIndex;
	};

	const viewAssetHandler = (event: CustomEvent) => {
		const { assetId, deviceId }: { assetId: string; deviceId: string } = event.detail;

		currentViewAssetIndex = $flattenAssetGroupByDate.findIndex((a) => a.id == assetId);
		currentSelectedAsset = $flattenAssetGroupByDate[currentViewAssetIndex];
		isShowAsset = true;
	};

	const uploadClickedHandler = async () => {
		if ($session.user) {
			try {
				let fileSelector = document.createElement('input');

				fileSelector.type = 'file';
				fileSelector.multiple = true;
				fileSelector.accept = 'image/*,video/*,.heic,.heif';

				fileSelector.onchange = async (e: any) => {
					const files = Array.from<File>(e.target.files);

					const acceptedFile = files.filter(
						(e) => e.type.split('/')[0] === 'video' || e.type.split('/')[0] === 'image'
					);

					for (const asset of acceptedFile) {
						await fileUploader(asset, $session.user!.accessToken);
					}
				};

				fileSelector.click();
			} catch (e) {
				console.log('Error seelcting file', e);
			}
		}
	};
</script>

<svelte:head>
	<title>Photos - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={uploadClickedHandler} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />

	<!-- Main Section -->
	<section class="overflow-y-auto relative">
		<section id="assets-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<section id="image-grid" class="flex flex-wrap gap-14">
				{#each $assetsGroupByDate as assetsInDateGroup, groupIndex}
					<!-- Asset Group By Date -->
					<div
						class="flex flex-col"
						on:mouseenter={() => (isMouseOverGroup = true)}
						on:mouseleave={() => (isMouseOverGroup = false)}
					>
						<!-- Date group title -->
						<p class="font-medium text-sm text-immich-fg mb-2 flex place-items-center h-6">
							{#if selectedGroupThumbnail === groupIndex && isMouseOverGroup}
								<div
									in:fly={{ x: -24, duration: 200, opacity: 0.5 }}
									out:fly={{ x: -24, duration: 200 }}
									class="inline-block px-2 hover:cursor-pointer"
								>
									<CheckCircle size="24" color="#757575" />
								</div>
							{/if}

							{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
						</p>

						<!-- Image grid -->
						<div class="flex flex-wrap gap-[2px]">
							{#each assetsInDateGroup as asset}
								<ImmichThumbnail
									{asset}
									on:mouseEvent={thumbnailMouseEventHandler}
									on:viewAsset={viewAssetHandler}
									{groupIndex}
								/>
							{/each}
						</div>
					</div>
				{/each}
			</section>
		</section>
	</section>
</section>

<!-- Overlay Asset Viewer -->
{#if isShowAsset}
	<AssetViewer
		selectedAsset={currentSelectedAsset}
		selectedIndex={currentViewAssetIndex}
		on:close={() => (isShowAsset = false)}
	/>
{/if}
