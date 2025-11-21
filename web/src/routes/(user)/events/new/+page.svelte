<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { createEvent } from '@immich/sdk';
  import { Alert, Button, Field, Heading, Input, Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let eventName = $state('');
  let description = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  const isValid = $derived(eventName.trim().length > 0);

  const onSubmit = async (submitEvent: Event) => {
    submitEvent.preventDefault();

    if (!isValid || loading) {
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      const created = await createEvent({
        createEventDto: {
          eventName: eventName.trim(),
          description: description.trim() || undefined,
        },
      });

      await goto(`${AppRoute.EVENTS}/${created.id}/albums`);
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_event'));
      errorMessage = $t('errors.unable_to_create_event');
    } finally {
      loading = false;
    }
  };
</script>

<UserPageLayout title={$t('create_event')}>
  {#snippet buttons()}
    <Button size="small" color="secondary" href={AppRoute.EVENTS}>
      {$t('back_to_events')}
    </Button>
  {/snippet}

  <section class="mx-auto max-w-2xl space-y-6 px-4 md:px-0 pt-20 pb-12" data-testid="create-event-page">
    <div>
      <Heading size="medium">{$t('create_event')}</Heading>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{$t('create_event_description')}</p>
    </div>

    {#if errorMessage}
      <Alert color="danger" title={errorMessage} />
    {/if}

    <form class="space-y-6" onsubmit={onSubmit}>
      <Field label={$t('event_name')} required>
        <Input bind:value={eventName} placeholder={$t('event_name_placeholder')} autocomplete="off" required />
      </Field>

      <Field label={$t('event_description')} description={$t('event_description_hint')}>
        <Textarea bind:value={description} rows={4} />
      </Field>

      <div class="flex justify-end gap-2">
        <Button type="button" color="secondary" href={AppRoute.EVENTS}>
          {$t('cancel')}
        </Button>
        <Button type="submit" {loading} disabled={!isValid || loading}>
          {$t('create_event')}
        </Button>
      </div>
    </form>
  </section>
</UserPageLayout>
