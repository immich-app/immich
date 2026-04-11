<script lang="ts">
  import { Button, Field, FormModal, HelperText, NumberInput } from '@immich/ui';
  import { mdiDownload } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (quality?: number) => void;
  };

  const { onClose }: Props = $props();

  const QUALITY_PRESETS = [90, 75, 50] as const;
  const DEFAULT_CUSTOM_QUALITY = 65;

  let selectedQuality = $state<number | 'custom'>(QUALITY_PRESETS[1]);
  let customQuality = $state<number | undefined>(DEFAULT_CUSTOM_QUALITY);

  const isSubmitDisabled = $derived(
    selectedQuality === 'custom' && (!customQuality || customQuality < 1 || customQuality > 100),
  );

  const onSubmit = () => {
    const quality =
      selectedQuality === 'custom'
        ? Math.min(100, Math.max(1, Math.round(customQuality ?? DEFAULT_CUSTOM_QUALITY)))
        : selectedQuality;

    onClose(quality);
  };
</script>

<FormModal
  size="small"
  title={$t('download_compressed_jpeg')}
  submitText={$t('download')}
  icon={mdiDownload}
  disabled={isSubmitDisabled}
  {onClose}
  {onSubmit}
>
  <div class="flex flex-col gap-4">
    <Field label={$t('preset')}>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {#each QUALITY_PRESETS as quality}
          <Button
            type="button"
            size="small"
            fullWidth
            color={selectedQuality === quality ? 'primary' : 'secondary'}
            variant={selectedQuality === quality ? 'filled' : 'outline'}
            onclick={() => (selectedQuality = quality)}
          >
            {quality}%
          </Button>
        {/each}

        <Button
          type="button"
          size="small"
          fullWidth
          color={selectedQuality === 'custom' ? 'primary' : 'secondary'}
          variant={selectedQuality === 'custom' ? 'filled' : 'outline'}
          onclick={() => (selectedQuality = 'custom')}
        >
          {$t('custom')}
        </Button>
      </div>
      <HelperText>{$t('download_compressed_jpeg_description')}</HelperText>
    </Field>

    {#if selectedQuality === 'custom'}
      <Field label={$t('admin.image_quality')}>
        <NumberInput min={1} max={100} bind:value={customQuality} />
        <HelperText>{$t('download_compressed_jpeg_custom_description')}</HelperText>
      </Field>
    {/if}
  </div>
</FormModal>