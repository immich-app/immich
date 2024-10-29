<script>
  import { page } from '$app/stores';
  import Error from '$lib/components/error.svelte';
</script>

<Error error={$page.error}></Error>
