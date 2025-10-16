<script lang="ts">
  import { Modal, ModalBody, Button, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { duplicateTiePreference, type TiePreference } from '$lib/stores/duplicate-preferences';
  import { get } from 'svelte/store';
  import { mdiCogOutline } from '@mdi/js';

  const initialTie = get(duplicateTiePreference) as TiePreference;
  let tiePreferenceLocal = $state<TiePreference>(initialTie);

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const cancel = () => onClose();
  const confirm = () => {
    duplicateTiePreference.set(tiePreferenceLocal);
    onClose();
  };
  const resetToDefault = () => {
    tiePreferenceLocal = 'default';
  };
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
            color={tiePreferenceLocal === 'external' ? 'primary' : 'secondary'}
            aria-pressed={tiePreferenceLocal === 'external'}
            title={$t('deduplicate_prefer_external')}
            onclick={() => (tiePreferenceLocal = 'external')}
          >
            <Text class="hidden md:block">{$t('deduplicate_prefer_external')}</Text>
          </Button>
          <Button
            size="small"
            variant="ghost"
            class="rounded-none"
            color={tiePreferenceLocal === 'default' ? 'primary' : 'secondary'}
            aria-pressed={tiePreferenceLocal === 'default'}
            title={$t('deduplicate_prefer_default')}
            onclick={() => (tiePreferenceLocal = 'default')}
          >
            <Text class="hidden md:block">{$t('deduplicate_prefer_default')}</Text>
          </Button>
          <Button
            size="small"
            variant="ghost"
            class="rounded-none"
            color={tiePreferenceLocal === 'internal' ? 'primary' : 'secondary'}
            aria-pressed={tiePreferenceLocal === 'internal'}
            title={$t('deduplicate_prefer_internal')}
            onclick={() => (tiePreferenceLocal = 'internal')}
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
          <Button size="small" variant="ghost" color="secondary" onclick={cancel}>
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
