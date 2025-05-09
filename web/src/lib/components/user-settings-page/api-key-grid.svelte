<script lang="ts">
  import Checkbox from "../elements/checkbox.svelte";

  interface Props {
    title: string;
    content: string[];
  };

  let { title, content }: Props = $props();
</script>

<div class="m-4 flex flex-col gap-2">
  <Checkbox
    id=""
    label={title}
    labelClass="text-sm dark:text-immich-dark-fg"
  />
  <div class="ml-4 flex flex-wrap gap-x-5 gap-y-2">
    {#each content as item}
      <Checkbox
        id=""
        label={item}
        labelClass="text-sm dark:text-immich-dark-fg"
      />
    {/each}
  </div>
</div>
