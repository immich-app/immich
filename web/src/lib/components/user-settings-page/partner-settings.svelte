<script lang="ts">
	import { UserResponseDto, api } from '@api';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import Button from '../elements/buttons/button.svelte';
	import PartnerSelectionModal from './partner-selection-modal.svelte';
	import { handleError } from '../../utils/handle-error';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let partners: UserResponseDto[] = [];
	let showAddUserModal = false;

	$: {
		if (browser) {
			if (showAddUserModal) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = 'auto';
			}
		}
	}

	const handleAddPartner = async () => {
		try {
			showAddUserModal = true;
		} catch (error) {
			handleError(error, 'Unable to add partner');
		}
	};

	const handleRemovePartner = async (user: UserResponseDto) => {
		try {
			await api.partnerApi.removePartner(user.id);
			partners = await loadPartners();
		} catch (error) {
			handleError(error, 'Unable to remove partner');
		}
	};

	const addUserHandler = async (event: CustomEvent) => {
		const { selectedUsers }: { selectedUsers: UserResponseDto[] } = event.detail;

		try {
			for (const user of selectedUsers) {
				await api.partnerApi.addPartner(user.id);
			}

			partners = await loadPartners();
			showAddUserModal = false;
		} catch (error) {
			handleError(error, 'Unable to add partners');
		}
	};

	const loadPartners = async () => {
		const { data: sharedWith } = await api.partnerApi.getAllPartners();

		const partners: UserResponseDto[] = [];
		for (const partner of sharedWith) {
			const { data: user } = await api.userApi.getUserById(partner.sharedWith);
			if (user) {
				partners.push(user);
			}
		}
		return partners;
	};

	onMount(async () => {
		partners = await loadPartners();
	});
</script>

<section class="my-4">
	{#if partners.length > 0}
		<div class="flex flex-row gap-4">
			{#each partners as partner}
				<div class="flex rounded-lg gap-4 py-4 px-5 transition-all">
					<CircleAvatar user={partner} />

					<div class="text-left">
						<p class="text-immich-fg dark:text-immich-dark-fg">
							{partner.firstName}
							{partner.lastName}
						</p>
						<p class="text-xs ">
							{partner.email}
						</p>
					</div>
					<button
						on:click={() => handleRemovePartner(partner)}
						class="immich-circle-icon-button hover:bg-immich-primary/10 dark:text-immich-dark-fg hover:dark:bg-immich-dark-primary/20  rounded-full p-3 flex place-items-center place-content-center transition-all"
					>
						<Close size="16" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex justify-end">
		<Button size="sm" on:click={() => handleAddPartner()}>Add partner</Button>
	</div>
</section>

{#if showAddUserModal}
	<PartnerSelectionModal on:close={() => (showAddUserModal = false)} on:add-user={addUserHandler} />
{/if}
