<script lang="ts">
  import OnEvents from '#lib/components/OnEvents.svelte';
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { updateTagMutation } from '#lib/queries/tag.query.ts';
  import { Route } from '#lib/route.ts';
  import { ensurePrivateSession } from '#lib/utils/private-session.ts';
  import type { TreeNode } from '#lib/utils/tree-utils.ts';
  import { FormModal, Text, toastManager } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';

  type Props = {
    tag: TreeNode;
    onClose: () => void;
  };

  const { tag, onClose }: Props = $props();

  let tagColor = $state(tag.color ?? '');
  let tagName = $state(tag.value ?? '');
  let tagPath = $state(tag.path ?? '');
  const parentIsPrivate = $derived(tag.parents.some((parent) => parent.isPrivate));
  let isPrivate = $state(parentIsPrivate || tag.isPrivate);
  let lockRevision = 0;

  const onSessionLocked = () => {
    lockRevision++;
    if (tag.isEffectivelyPrivate || isPrivate) {
      onClose();
    }
  };

  const tagPathDisplay = $state(tagPath.endsWith(tagName) ? tagPath.slice(0, -tagName.length) : tagPath);

  const onSubmit = async () => {
    if (!tag.id) {
      return;
    }

    const revision = lockRevision;
    if ((isPrivate || tag.isEffectivelyPrivate) && (!(await ensurePrivateSession()) || revision !== lockRevision)) {
      return;
    }

    await executeMutation(
      updateTagMutation,
      [
        {
          id: tag.id,
          tagUpdateDto: {
            color: tagColor || null,
            name: tagName,
            ...(isPrivate !== tag.isPrivate && !parentIsPrivate && { isPrivate }),
          },
        },
      ],
      {
        onSuccess: (updated) => {
          toastManager.primary($t('saved'));
          onClose();
          if (revision === lockRevision && updated.value !== tag.path) {
            void goto(Route.tags({ path: updated.value }));
          }
        },
      },
    );
  };
</script>

<OnEvents {onSessionLocked} />
<FormModal title={$t('edit_tag')} size="small" icon={mdiTag} {onClose} {onSubmit}>
  <SettingInputField inputType={SettingInputFieldType.COLOR} label={$t('color')} bind:value={tagColor} />
  <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('name')} bind:value={tagName} />
  <SettingSwitch
    title={$t('private_tag')}
    subtitle={$t('private_tag_description')}
    bind:checked={isPrivate}
    disabled={parentIsPrivate}
  />
  {#if tagPathDisplay !== ''}
    <Text size="small">{$t('tag_full_path', { values: { tag: tagPathDisplay } })}{tagName}</Text>
  {/if}
</FormModal>
