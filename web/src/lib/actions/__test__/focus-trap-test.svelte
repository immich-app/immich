<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';

  export let show: boolean;
</script>

<button type="button" on:click={() => (show = true)}>Open</button>

{#if show}
  <div use:focusTrap>
    <div>
      <span>text</span>
      <button data-testid="one" type="button" on:click={() => (show = false)}>Close</button>
    </div>
    <input data-testid="two" disabled />
    <input data-testid="three" />
  </div>
{/if}
