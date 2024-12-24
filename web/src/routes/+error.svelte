<script>
  import { page } from '$app/state';
  import Error from '$lib/components/error.svelte';
</script>

<Error error={page.error}></Error>
