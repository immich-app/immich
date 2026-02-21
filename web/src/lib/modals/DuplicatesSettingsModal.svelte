<script lang="ts">
  import {
    duplicateTiePreference,
    findDuplicateTiePreference,
    setDuplicateTiePreference,
  } from '$lib/stores/duplicate-tie-preferences-manager.svelte';
  import { Button, ConfirmModal, Text, VStack } from '@immich/ui';
  import { mdiCogOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();

  let tiePreferenceLocal = $state(duplicateTiePreference.value);

  const handleConfirm = () => {
    setDuplicateTiePreference(tiePreferenceLocal);
    onClose();
  };

  const makeSourcePreference = (priority: 'internal' | 'external') => ({
    variant: 'source' as const,
    priority,
  });
</script>

<ConfirmModal
  title={$t('duplicates_settings')}
  icon={mdiCogOutline}
  confirmColor="primary"
  confirmText={$t('save')}
  onClose={(confirmed) => (confirmed ? handleConfirm() : onClose())}
>
  {#snippet prompt()}
    <VStack class="items-start">
      <Text class="font-bold">{$t('deduplicate_source_preference')}</Text>

      <div
        class="inline-flex rounded-full overflow-hidden border border-gray-700"
        role="group"
        aria-label={$t('duplicates_settings')}
      >
        <Button
          size="small"
          variant="ghost"
          class="rounded-none"
          color={findDuplicateTiePreference(tiePreferenceLocal, 'source')?.priority === 'external'
            ? 'primary'
            : 'secondary'}
          aria-pressed={findDuplicateTiePreference(tiePreferenceLocal, 'source')?.priority === 'external'}
          title={$t('deduplicate_prefer_external')}
          onclick={() => (tiePreferenceLocal = [makeSourcePreference('external')])}
        >
          <Text class="hidden md:block">{$t('deduplicate_prefer_external')}</Text>
        </Button>
        <Button
          size="small"
          variant="ghost"
          class="rounded-none"
          color={tiePreferenceLocal === undefined ? 'primary' : 'secondary'}
          aria-pressed={tiePreferenceLocal === undefined}
          title={$t('deduplicate_prefer_default')}
          onclick={() => (tiePreferenceLocal = undefined)}
        >
          <Text class="hidden md:block">{$t('deduplicate_prefer_default')}</Text>
        </Button>
        <Button
          size="small"
          variant="ghost"
          class="rounded-none"
          color={findDuplicateTiePreference(tiePreferenceLocal, 'source')?.priority === 'internal'
            ? 'primary'
            : 'secondary'}
          aria-pressed={findDuplicateTiePreference(tiePreferenceLocal, 'source')?.priority === 'internal'}
          title={$t('deduplicate_prefer_internal')}
          onclick={() => (tiePreferenceLocal = [makeSourcePreference('internal')])}
        >
          <Text class="hidden md:block">{$t('deduplicate_prefer_internal')}</Text>
        </Button>
      </div>
    </VStack>
  {/snippet}
</ConfirmModal>
