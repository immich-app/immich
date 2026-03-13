<script lang="ts">
  import ColorPicker from '$lib/components/spaces/color-picker.svelte';
  import { createSpace, UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Textarea } from '@immich/ui';
  import { mdiAccountGroup } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (space?: SharedSpaceResponseDto) => void;
  };

  let { onClose }: Props = $props();

  let name = $state('');
  let description = $state('');
  let color = $state<UserAvatarColor>(UserAvatarColor.Primary);

  const onSubmit = async () => {
    const space = await createSpace({
      sharedSpaceCreateDto: {
        name,
        description: description || undefined,
        color,
      },
    });
    onClose(space);
  };
</script>

<FormModal icon={mdiAccountGroup} title={$t('spaces_create')} size="small" {onClose} {onSubmit}>
  <div class="flex flex-col gap-4 m-4">
    <Field label={$t('name')} required>
      <Input bind:value={name} autofocus />
    </Field>
    <Field label={$t('description')}>
      <Textarea bind:value={description} />
    </Field>
    <Field label={$t('color')}>
      <ColorPicker value={color} onchange={(c) => (color = c)} />
    </Field>
  </div>
</FormModal>
