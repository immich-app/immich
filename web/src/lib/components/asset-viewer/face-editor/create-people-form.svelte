<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { createPerson, type PersonResponseDto } from '@immich/sdk';
  import { Button, Checkbox, Field, Input, Stack } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';

  type Props = {
    onDone: (person: PersonResponseDto) => void;
  };

  let { onDone }: Props = $props();

  let name = $state('');
  let isFavorite = $state(false);

  const createAndTag = async (event: Event) => {
    event.preventDefault();

    try {
      const person = await createPerson({
        personCreateDto: {
          name,
          isFavorite,
        },
      });

      onDone(person);
    } catch (error) {
      handleError(error, 'Error creating new person');
    }
  };
</script>

<form onsubmit={createAndTag} autocomplete="off" id="create-new-person-form" class="mt-4 text-sm">
  <Stack gap={4}>
    <Field label={'Person name'} required>
      <Input bind:value={name} type="text" />
    </Field>

    <Field label="Favorite">
      <Checkbox bind:checked={isFavorite} />
    </Field>
  </Stack>

  <Button leadingIcon={mdiPlus} size="small" fullWidth class="mt-4" type="submit">Create and tag</Button>
</form>
