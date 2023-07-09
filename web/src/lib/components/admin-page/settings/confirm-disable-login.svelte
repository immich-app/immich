<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
</script>

<ConfirmDialogue title="Disable Login" on:cancel on:confirm>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      <p>Are you sure you want to disable all login methods? Login will be completely disabled.</p>
      <p>
        To re-enable, use a
        <a
          href="https://immich.app/docs/administration/server-commands"
          rel="noreferrer"
          target="_blank"
          class="underline"
        >
          Server Command</a
        >.
      </p>
    </div>
  </svelte:fragment>
</ConfirmDialogue>
