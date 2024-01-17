<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
</script>

<ConfirmDialogue title="Enable Import Faces from Metadata" on:cancel on:confirm>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4 text-left">
      <p>
        Importing faces from metadata is currently incompatible with machine learning face recognition.
      </p>
      <p>
        Are you sure you want to enable importing faces from metadata?
      </p>
    </div>
  </svelte:fragment>
</ConfirmDialogue>
