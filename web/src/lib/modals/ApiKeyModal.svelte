<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import ApiKeyGrid from '$lib/components/user-settings-page/user-api-key-grid.svelte';
  import { Permission } from '@immich/sdk';
  import { Button, Checkbox, Field, HStack, IconButton, Input, Label, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiClose, mdiKeyVariant } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  const matches = (value: string) => {
    value = value.toLowerCase();
    return ([title, items]: [string, Permission[]]) => {
      return title.toLowerCase().includes(value) || items.some((item) => item.toLowerCase().includes(value));
    };
  };

  interface Props {
    apiKey: { name: string; permissions: Permission[] };
    title: string;
    cancelText?: string;
    submitText?: string;
    onClose: (apiKey?: { name: string; permissions: Permission[] }) => void;
  }

  let { apiKey = $bindable(), title, cancelText = $t('cancel'), submitText = $t('save'), onClose }: Props = $props();
  let name = $derived(apiKey.name);

  let selectedItems: Permission[] = $state(apiKey.permissions);
  let selectAllItems = $derived(selectedItems.length === Object.keys(Permission).length - 1);

  const permissions: Record<string, Permission[]> = {};
  for (const permission of Object.values(Permission)) {
    if (permission === Permission.All) {
      continue;
    }

    const [group] = permission.split('.');
    if (!permissions[group]) {
      permissions[group] = [];
    }
    permissions[group].push(permission);
  }

  let searchValue = $state('');
  let filteredResults = $derived(Object.entries(permissions).filter(matches(searchValue)));

  const handleSelectItems = (permissions: Permission[]) => {
    selectedItems = Array.from(new Set([...selectedItems, ...permissions]));
  };

  const handleDeselectItems = (permissions: Permission[]) => {
    selectedItems = selectedItems.filter((item) => !permissions.includes(item));
  };

  const handleSelectAllItems = () => {
    selectedItems = selectAllItems ? [] : Object.values(Permission).filter((item) => item !== Permission.All);
  };

  const handleSubmit = () => {
    if (!apiKey.name) {
      notificationController.show({
        message: $t('api_key_empty'),
        type: NotificationType.Warning,
      });
    } else if (selectedItems.length === 0) {
      notificationController.show({
        message: $t('permission_empty'),
        type: NotificationType.Warning,
      });
    } else {
      if (selectAllItems) {
        onClose({ name, permissions: [Permission.All] });
      } else {
        onClose({ name, permissions: selectedItems });
      }
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    handleSubmit();
  };

  onMount(() => {
    if (apiKey.permissions.includes(Permission.All)) {
      handleSelectAllItems();
    }
  });
</script>

<Modal {title} icon={mdiKeyVariant} {onClose} size="giant">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="api-key-form">
      <div class="mb-4 flex flex-col gap-2">
        <Field label={$t('name')}>
          <Input bind:value={name} />
        </Field>
      </div>
      <Label label={$t('permission')} for="permission-container" />
      <div class="flex items-center gap-2 m-4" id="permission-container">
        <Checkbox id="input-select-all" size="tiny" checked={selectAllItems} onCheckedChange={handleSelectAllItems} />
        <Label label={$t('select_all')} for="input-select-all" />
      </div>

      <div class="ms-4 flex flex-col gap-2">
        <Input bind:value={searchValue} placeholder={$t('search')}>
          {#snippet trailingIcon()}
            {#if searchValue}
              <IconButton
                icon={mdiClose}
                size="small"
                variant="ghost"
                shape="round"
                color="secondary"
                class="me-1"
                onclick={() => (searchValue = '')}
                aria-label={$t('clear')}
              />
            {/if}
          {/snippet}
        </Input>
        {#each filteredResults as [title, subItems] (title)}
          <ApiKeyGrid {title} {subItems} {selectedItems} {handleSelectItems} {handleDeselectItems} />
        {/each}
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{cancelText}</Button>
      <Button shape="round" type="submit" fullWidth form="api-key-form">{submitText}</Button>
    </HStack>
  </ModalFooter>
</Modal>
