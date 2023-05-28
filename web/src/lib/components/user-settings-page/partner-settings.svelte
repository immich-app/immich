<script lang="ts">
	import { UserResponseDto, api } from '@api';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import Button from '../elements/buttons/button.svelte';
	import PartnerSelectionModal from './partner-selection-modal.svelte';
	import { handleError } from '../../utils/handle-error';
	import { onMount } from 'svelte';
	import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

	export let user: UserResponseDto;

	let partners: UserResponseDto[] = [];
	let createPartner = false;
	let removePartner: UserResponseDto | null = null;

	const refreshPartners = async () => {
		const { data } = await api.partnerApi.getPartners({ direction: 'shared-by' });
		partners = data;
	};

	const handleRemovePartner = async () => {
		if (!removePartner) {
			return;
		}

		try {
			await api.partnerApi.removePartner({ id: removePartner.id });
			removePartner = null;
			await refreshPartners();
		} catch (error) {
			handleError(error, 'Unable to remove partner');
		}
	};

	const handleCreatePartners = async (users: UserResponseDto[]) => {
		try {
			for (const user of users) {
				await api.partnerApi.createPartner({ id: user.id });
			}

			await refreshPartners();
			createPartner = false;
		} catch (error) {
			handleError(error, 'Unable to add partners');
		}
	};

	onMount(async () => {
		await refreshPartners();
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
						<p class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">
							{partner.email}
						</p>
					</div>
					<CircleIconButton
						on:click={() => (removePartner = partner)}
						logo={Close}
						size={'16'}
						title="Remove partner"
					/>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex justify-end">
		<Button size="sm" on:click={() => (createPartner = true)}>Add partner</Button>
	</div>
</section>

{#if createPartner}
	<PartnerSelectionModal
		{user}
		on:close={() => (createPartner = false)}
		on:add-users={(event) => handleCreatePartners(event.detail)}
	/>
{/if}

{#if removePartner}
	<ConfirmDialogue
		title="Stop sharing your photos?"
		prompt="{removePartner.firstName} will no longer be able to access your photos."
		on:cancel={() => (removePartner = null)}
		on:confirm={() => handleRemovePartner()}
	/>
{/if}
