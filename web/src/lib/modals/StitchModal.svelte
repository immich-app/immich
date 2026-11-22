<script lang="ts">
  import Combobox, { type ComboBoxOption } from '#lib/components/shared-components/Combobox.svelte';
  import { FormModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    count: number;
    onClose: (mode: 'scroll' | 'panorama' | undefined) => void;
  }

  let { count, onClose }: Props = $props();

  const options: ComboBoxOption[] = [
    { id: 'scroll', label: $t('stitch_mode_scroll'), value: 'scroll' },
    { id: 'panorama', label: $t('stitch_mode_panorama'), value: 'panorama' },
  ];
  let selectedOption: ComboBoxOption | undefined = $state(options[0]);

  const onSubmit = () => onClose((selectedOption?.value as 'scroll' | 'panorama' | undefined) ?? 'scroll');
</script>

<FormModal title={$t('stitch_title')} submitText={$t('stitch_start')} {onClose} {onSubmit}>
  <p class="pb-4 text-sm">{$t('stitch_description', { values: { count } })}</p>
  <Combobox bind:selectedOption label={$t('stitch_mode')} {options} placeholder={$t('stitch_mode')} />
</FormModal>
