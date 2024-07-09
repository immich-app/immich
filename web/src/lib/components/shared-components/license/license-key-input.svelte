<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
</script>

<p>Have a license? Enter the key below</p>
<div class="mt-2 flex gap-2">
  <input class="immich-form-input w-full" id="licensekey" type="text" required />
  <Button type="button" rounded="lg">Activate</Button>
</div>
