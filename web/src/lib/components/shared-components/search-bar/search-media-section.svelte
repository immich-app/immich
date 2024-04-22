<script lang="ts">
  import { MediaType } from './search-filter-box.svelte';

  export let filteredMedia: MediaType;
</script>

<div id="media-type-selection">
  <fieldset class="flex flex-wrap gap-x-5 gap-y-2 mt-1 text-base">
    <legend>MEDIA TYPE</legend>
    <label for="type-all" class="flex items-center gap-1 text-sm">
      <input
        bind:group={filteredMedia}
        value={MediaType.All}
        type="radio"
        name="media-type"
        id="type-all"
        class="size-4 focus-visible:ring-2"
      />
      <span class="pt-0.5">All</span>
    </label>

    <label for="type-image" class="flex items-center gap-1 text-sm">
      <input
        bind:group={filteredMedia}
        value={MediaType.Image}
        type="radio"
        name="media-type"
        id="type-image"
        class="size-4 focus-visible:ring-2"
      />
      <span class="pt-0.5">Image</span>
    </label>

    <label for="type-video" class="flex items-center gap-1 text-sm">
      <input
        bind:group={filteredMedia}
        value={MediaType.Video}
        type="radio"
        name="media-type"
        id="type-video"
        class="size-4 focus-visible:ring-2"
      />
      <span class="pt-0.5">Video</span>
    </label>
  </fieldset>
</div>
