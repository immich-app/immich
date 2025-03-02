<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PhotoTimeline from '$lib/components/PhotoTimeline.svelte';
</script>

<UserPageLayout showUploadButton noWrapper>
  <PhotoTimeline />
</UserPageLayout>
