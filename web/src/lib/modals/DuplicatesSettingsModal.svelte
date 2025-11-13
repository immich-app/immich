<script lang="ts">
  import { Modal, ModalBody, Button, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import {
    duplicateTiePreference,
    findDuplicateTiePreference,
    type SourcePreference,
    setDuplicateTiePreference,
  } from '$lib/stores/duplicate-tie-preferences.svelte';
  import { mdiCogOutline } from '@mdi/js';

  let tiePreferenceLocal = $state(duplicateTiePreference.value);

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const confirm = () => {
    setDuplicateTiePreference(tiePreferenceLocal);
    onClose();
  };

  const resetToDefault = () => {
    tiePreferenceLocal = undefined;
  };

  const makeSourcePref = (priority: 'internal' | 'external'): SourcePreference => ({variant: 'source', priority});

</script>

<Modal title={$t('duplicates_settings')} {onClose} icon={mdiCogOutline}>
  <ModalBody>
    <div class="space-y-3">
      <section class="rounded-2xl border dark:border-2 border-gray-300 dark:border-gray-700 p-4">
        <h4 class="text-sm font-semibold mb-3">{$t('deduplicate_source_preference')}</h4>

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
            onclick={() => (tiePreferenceLocal = [makeSourcePref('external')])}
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
            onclick={() => (tiePreferenceLocal = [makeSourcePref('internal')])}
          >
            <Text class="hidden md:block">{$t('deduplicate_prefer_internal')}</Text>
          </Button>
        </div>
      </section>

      <div class="flex items-center justify-between gap-2 pt-2">
        <Button size="small" variant="ghost" color="secondary" onclick={resetToDefault}>
          <Text>{$t('reset_to_default')}</Text>
        </Button>

        <div class="flex items-center gap-2">
          <Button size="small" variant="ghost" color="secondary" onclick={onClose}>
            <Text>{$t('cancel')}</Text>
          </Button>
          <Button size="small" color="primary" onclick={confirm}>
            <Text>{$t('confirm')}</Text>
          </Button>
        </div>
      </div>
    </div>
  </ModalBody>
</Modal>
