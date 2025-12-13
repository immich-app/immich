<script>
  import { page } from '$app/state';
  import ErrorLayout from '$lib/components/layouts/ErrorLayout.svelte';
</script>

<ErrorLayout error={page.error}></ErrorLayout>
