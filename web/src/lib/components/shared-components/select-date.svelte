<script lang="ts">
  import DateInput from '$lib/components/elements/date-input.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    initialDate?: DateTime;

    onCancel: () => void;
    onConfirm: (date: DateTime) => void;
  }

  let { initialDate = DateTime.now(), onCancel, onConfirm }: Props = $props();
  let selectedDate = $state(initialDate.toFormat("yyyy-MM-dd'T'HH:mm"));

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  const date = $derived(DateTime.fromISO(selectedDate));

  const handleConfirm = () => {
    if (date) {
      onConfirm(date);
    }
  };
</script>

<ConfirmDialog
  confirmColor="primary"
  title="Go to date"
  disabled={!date.isValid}
  onClose={(confirmed) => (confirmed ? handleConfirm() : onCancel())}
>
  {#snippet promptSnippet()}
    <div class="flex flex-col text-left gap-2">
      <div class="flex flex-col">
        <label for="datetime">{$t('date_and_time')}</label>
        <DateInput
          class="immich-form-input"
          id="datetime"
          type="datetime-local"
          bind:value={selectedDate}
          autofocus
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
            if (e.key === 'Escape') {
              onCancel();
            }
          }}
        />
      </div>
    </div>
  {/snippet}
</ConfirmDialog>
