<script lang="ts">
  import RadioButton from '$lib/components/elements/radio-button.svelte';
  import { MediaType } from './search-filter-modal.svelte';
  import { t } from 'svelte-i18n';

  export let filteredMedia: MediaType;
</script>

<div id="media-type-selection">
  <fieldset>
    <legend class="immich-form-label">{$t('media_type').toUpperCase()}</legend>
    <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1">
      <RadioButton name="media-type" id="type-all" bind:group={filteredMedia} label={$t('all')} value={MediaType.All} />
      <RadioButton
        name="media-type"
        id="type-image"
        bind:group={filteredMedia}
        label={$t('image')}
        value={MediaType.Image}
      />
      <RadioButton
        name="media-type"
        id="type-video"
        bind:group={filteredMedia}
        label={$t('video')}
        value={MediaType.Video}
      />
    </div>
  </fieldset>
</div>
