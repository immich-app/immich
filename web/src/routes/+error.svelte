<script>
  import { page } from '$app/state';
  import ErrorLayout from './ErrorLayout.svelte';
</script>

<ErrorLayout error={page.error}></ErrorLayout>
