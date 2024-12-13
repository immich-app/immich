<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';

  interface Props {
    show: boolean;
  }

  let { show = $bindable() }: Props = $props();
</script>

<button type="button" onclick={() => (show = true)}>Open</button>

{#if show}
  <div use:focusTrap>
    <div>
      <span>text</span>
      <button data-testid="one" type="button" onclick={() => (show = false)}>Close</button>
    </div>
    <input data-testid="two" disabled />
    <input data-testid="three" />
  </div>
{/if}
