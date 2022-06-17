<script lang="ts">
	import { quartInOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import CloudUploadOutline from 'svelte-material-icons/CloudUploadOutline.svelte';
	import WindowMinimize from 'svelte-material-icons/WindowMinimize.svelte';

	let showDetail = false;

	let array = [2, 3, 4, 5, 5, 5, 5, 5, 5];
</script>

<div class="absolute right-6 bottom-6 z-[10000]">
	{#if !showDetail}
		<div
			in:scale={{ duration: 250, easing: quartInOut }}
			class="bg-gray-200 p-4 text-sm w-[300px] rounded-lg shadow-sm border "
		>
			<div class="flex justify-between place-item-center mb-4">
				<p class="text-xs text-gray-500">UPLOADING</p>
				<button
					on:click={() => (showDetail = false)}
					class="w-[20px] h-[20px] bg-gray-50 rounded-full flex place-items-center place-content-center transition-colors hover:bg-gray-100"
				>
					<WindowMinimize />
				</button>
			</div>

			<div id="upload-item-list" class="max-h-[400px] overflow-y-auto pr-2 rounded-lg">
				{#each array as i}
					<div class="text-xs mt-1 border border-gray-300  rounded-lg bg-immich-bg flex place-items-center">
						<img
							src="https://images.pexels.com/photos/11352067/pexels-photo-11352067.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2"
							alt=""
							class="w-[50px] h-[50px] object-cover rounded-tl-lg rounded-bl-lg"
						/>

						<div class="flex-auto p-2">
							<p>Image Name</p>
							<div class="w-full bg-gray-300 h-[7px] rounded-full mt-[5px]">
								<div class="bg-immich-primary h-[7px] rounded-full w-[50%]" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="rounded-full">
			<button
				in:scale={{ duration: 250, easing: quartInOut }}
				on:click={() => (showDetail = true)}
				class="absolute -top-6 -left-6 text-xs rounded-full w-10 h-10 p-5 flex place-items-center place-content-center bg-immich-primary text-gray-200 border-immich-bg border-4"
			>
				1/50
			</button>
			<button
				in:scale={{ duration: 250, easing: quartInOut }}
				on:click={() => (showDetail = true)}
				class="bg-immich-primary/25 p-5 rounded-full w-16 h-16 flex place-items-center place-content-center text-sm shadow-lg "
			>
				<div class="nimate-pulse">
					<CloudUploadOutline size="30" color="#4250af" />
				</div>
			</button>
		</div>
	{/if}
</div>

<style>
	/* width */
	#upload-item-list::-webkit-scrollbar {
		width: 5px;
	}

	/* Track */
	#upload-item-list::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 16px;
	}

	/* Handle */
	#upload-item-list::-webkit-scrollbar-thumb {
		background: #4250af68;
		border-radius: 16px;
	}

	/* Handle on hover */
	#upload-item-list::-webkit-scrollbar-thumb:hover {
		background: #4250afad;
		border-radius: 16px;
	}
</style>
