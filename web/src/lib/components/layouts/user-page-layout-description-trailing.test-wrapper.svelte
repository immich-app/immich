<script lang="ts">
  import UserPageLayout from './user-page-layout.svelte';
</script>

<UserPageLayout title="People" description="(60) \u00b7 2,901 faces">
  {#snippet descriptionTrailing()}
    <button type="button">Info</button>
  {/snippet}
</UserPageLayout>
