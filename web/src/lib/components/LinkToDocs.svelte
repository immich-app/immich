<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { Link } from '@immich/ui';

  type Props = {
    href: string;
  };

  const { href }: Props = $props();
</script>

<FormatMessage key="link_to_docs">
  {#snippet children({ message })}
    <Link {href}>{message}</Link>
  {/snippet}
</FormatMessage>
