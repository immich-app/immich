<script lang="ts">
  import { ImageEnrichmentFilter } from '@immich/sdk';
  import { Field, Select } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    imageEnrichment?: ImageEnrichmentFilter | '';
  }

  let { imageEnrichment = $bindable('') }: Props = $props();

  const options = $derived([
    { label: $t('all'), value: '' },
    { label: $t('image_enrichment_filter_nsfw'), value: ImageEnrichmentFilter.Nsfw },
    { label: $t('image_enrichment_filter_nsfw_review'), value: ImageEnrichmentFilter.NsfwReview },
    { label: $t('image_enrichment_filter_nsfw_reviewed'), value: ImageEnrichmentFilter.NsfwReviewed },
    { label: $t('image_enrichment_filter_nsfw_overridden'), value: ImageEnrichmentFilter.NsfwOverridden },
    {
      label: $t('image_enrichment_filter_description_failed'),
      value: ImageEnrichmentFilter.ImageDescriptionFailed,
    },
    { label: $t('image_enrichment_filter_nsfw_failed'), value: ImageEnrichmentFilter.NsfwDetectionFailed },
    {
      label: $t('image_enrichment_filter_missing_description'),
      value: ImageEnrichmentFilter.MissingImageDescription,
    },
    { label: $t('image_enrichment_filter_missing_nsfw'), value: ImageEnrichmentFilter.MissingNsfwDetection },
  ]);
</script>

<div id="image-enrichment-selection">
  <Field label={$t('image_enrichment')}>
    <Select bind:value={imageEnrichment} {options} />
  </Field>
</div>
