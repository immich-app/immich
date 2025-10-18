<script lang="ts" module>
  export interface SearchResolutionFilter {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }
</script>

<script lang="ts">
  interface Props {
    filters: SearchResolutionFilter;
  }

  let { filters = $bindable() }: Props = $props();
</script>

<div>
  <p class="immich-form-label">{'resolution'.toUpperCase()}</p>

  <div class="flex gap-5">
    <label class="immich-form-label" for="minWidth">
      <span>{'min Width'.toUpperCase()}</span>
      <input
        class="immich-form-input w-full"
        type="number"
        id="minWidth"
        name="minWidth"
        bind:value={filters.minWidth}
        placeholder="1280"
      />
    </label>
    <label class="immich-form-label" for="maxWidth">
      <span>{'max Width'.toUpperCase()}</span>
      <input
        class="immich-form-input w-full"
        type="number"
        id="maxWidth"
        name="maxWidth"
        bind:value={filters.maxWidth}
        placeholder="1920"
      />
    </label>

    <label class="immich-form-label" for="minHeight">
      <span>{'min Height'.toUpperCase()}</span>
      <input
        class="immich-form-input w-full"
        type="number"
        id="minHeight"
        name="minHeight"
        bind:value={filters.minHeight}
        placeholder="720"
      />
    </label>
    <label class="immich-form-label" for="maxHeight">
      <span>{'max Height'.toUpperCase()}</span>
      <input
        class="immich-form-input w-full"
        type="number"
        id="maxHeight"
        name="maxHeight"
        bind:value={filters.maxHeight}
        placeholder="1080"
      />
    </label>
  </div>
</div>
