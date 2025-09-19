<script lang="ts">
  import { Label, Link, Text } from '@immich/ui';

  type Props = {
    id: string;
    title: string;
    version?: string;
    versionHref?: string;
    class?: string;
  };

  const { id, title, version, versionHref, class: className }: Props = $props();
</script>

<div class={className}>
  <Label size="small" color="primary" for={id}>{title}</Label>
  <Text size="small" color="muted" {id}>
    {#if versionHref}
      <Link external href={versionHref}>{version}</Link>
    {:else}
      {version}
    {/if}
  </Text>
</div>
