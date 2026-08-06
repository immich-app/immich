<script lang="ts">
  import { focusOnPointerDown } from '$lib/actions/focus-on-pointer-down';
</script>

<div data-testid="target" tabindex="-1" use:focusOnPointerDown>
  <button type="button" data-testid="button">button</button>
  <span data-testid="span">span</span>
</div>
