<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllSpaces, SharedSpaceRole, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (space?: SharedSpaceResponseDto) => void;
  };

  const { onClose }: Props = $props();

  let spaces = $state<SharedSpaceResponseDto[]>([]);
  let loading = $state(true);
  let search = $state('');
  let selectedRowIndex = $state(0);

  const currentUserId = $derived(authManager.authenticated ? (authManager.user?.id ?? null) : null);
  const writableSpaces = $derived(spaces.filter((space) => canWrite(space)));
  const filteredSpaces = $derived(
    writableSpaces.filter((space) => space.name.toLowerCase().includes(search.trim().toLowerCase())),
  );

  onMount(async () => {
    try {
      spaces = await getAllSpaces();
    } catch (error) {
      handleError(error, $t('failed_to_load_spaces'));
      spaces = [];
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    if (filteredSpaces.length === 0) {
      selectedRowIndex = 0;
      return;
    }
    if (selectedRowIndex >= filteredSpaces.length) {
      selectedRowIndex = filteredSpaces.length - 1;
    }
  });

  const getCurrentUserRole = (space: SharedSpaceResponseDto) => {
    if (space.createdById === currentUserId) {
      return SharedSpaceRole.Owner;
    }
    return space.members?.find((member) => member.userId === currentUserId)?.role as SharedSpaceRole | undefined;
  };

  const canWrite = (space: SharedSpaceResponseDto) => {
    const role = getCurrentUserRole(space);
    return role === SharedSpaceRole.Owner || role === SharedSpaceRole.Editor;
  };

  const getRoleLabel = (space: SharedSpaceResponseDto) => {
    const role = getCurrentUserRole(space);
    return role === SharedSpaceRole.Editor ? $t('role_editor') : $t('owner');
  };

  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        selectedRowIndex = selectedRowIndex > 0 ? selectedRowIndex - 1 : Math.max(filteredSpaces.length - 1, 0);
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        selectedRowIndex = selectedRowIndex < filteredSpaces.length - 1 ? selectedRowIndex + 1 : 0;
        break;
      }
      case 'Enter': {
        event.preventDefault();
        const selected = filteredSpaces[selectedRowIndex];
        if (selected) {
          onClose(selected);
        }
        break;
      }
    }
  };
</script>

<Modal title={$t('add_to_space')} {onClose} size="small">
  <ModalBody>
    <div class="mb-2 flex max-h-100 flex-col">
      {#if loading}
        <div class="flex animate-pulse flex-col gap-3 px-6 py-4">
          <span class="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700"></span>
          <span class="h-5 w-56 rounded bg-slate-200 dark:bg-slate-700"></span>
          <span class="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700"></span>
        </div>
      {:else}
        <input
          class="border-b-4 border-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:focus:border-immich-dark-primary"
          aria-label={$t('search')}
          placeholder={$t('search')}
          bind:value={search}
          onkeydown={handleKeydown}
          use:initInput
        />
        <div class="immich-scrollbar overflow-y-auto">
          {#if filteredSpaces.length === 0}
            <p class="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">{$t('spaces_no_writable_spaces')}</p>
          {:else}
            {#each filteredSpaces as space, index (space.id)}
              <button
                type="button"
                class={[
                  'flex w-full items-center justify-between gap-4 px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800',
                  index === selectedRowIndex ? 'bg-gray-100 dark:bg-gray-800' : '',
                ].join(' ')}
                onclick={() => onClose(space)}
                onmouseenter={() => (selectedRowIndex = index)}
              >
                <span class="min-w-0 truncate font-medium text-black dark:text-white">{space.name}</span>
                <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(space)}</span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </ModalBody>
</Modal>
