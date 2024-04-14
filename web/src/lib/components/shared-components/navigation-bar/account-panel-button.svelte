<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  export let title = '';
  export let icon = '';
</script>

<Button color="dark-gray" class="w-[100%]" size="sm" shadow={false} border on:click>
  <div class="flex place-content-center place-items-center gap-2 px-2">
    <slot>
      <Icon path={icon} size="18" />
      {title}
    </slot>
  </div>
</Button>
