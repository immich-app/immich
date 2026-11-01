<script lang="ts">
  import OnEvents from '#lib/components/OnEvents.svelte';
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { createTagMutation, upsertTagsMutation } from '#lib/queries/tag.query.ts';
  import { ensurePrivateSession } from '#lib/utils/private-session.ts';
  import type { TreeNode } from '#lib/utils/tree-utils.ts';
  import { FormModal, Text, toastManager } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    baseTag?: TreeNode;
  };

  const { onClose, baseTag }: Props = $props();

  const parentIsPrivate = $derived(baseTag?.isEffectivelyPrivate === true);
  const tagPath = $state(baseTag?.path ? `${baseTag.path}/` : '');
  let tagName = $state('');
  let isPrivate = $state(parentIsPrivate);
  let lockRevision = 0;

  const onSessionLocked = () => {
    lockRevision++;
    if (parentIsPrivate || isPrivate) {
      onClose();
    }
  };

  const onSubmit = async () => {
    const onCreated = () => {
      toastManager.primary($t('saved'));
      onClose();
    };

    if (parentIsPrivate || isPrivate) {
      const revision = lockRevision;
      if (!(await ensurePrivateSession()) || revision !== lockRevision) {
        return;
      }

      await executeMutation(
        createTagMutation,
        [{ tagCreateDto: { name: tagName, parentId: baseTag?.id, isPrivate: !parentIsPrivate && isPrivate } }],
        { onSuccess: onCreated },
      );
    } else {
      await executeMutation(upsertTagsMutation, [{ tagUpsertDto: { tags: [tagPath + tagName] } }], {
        onSuccess: onCreated,
      });
    }
  };
</script>

<OnEvents {onSessionLocked} />
<FormModal size="small" title={$t('create_tag')} submitText={$t('create')} icon={mdiTag} {onClose} {onSubmit}>
  <Text size="small" class="mb-4">{$t('create_tag_description')}</Text>
  <SettingInputField inputType={SettingInputFieldType.TEXT} label={$t('tag')} bind:value={tagName} />
  <SettingSwitch
    title={$t('private_tag')}
    subtitle={$t('private_tag_description')}
    bind:checked={isPrivate}
    disabled={parentIsPrivate}
  />
  {#if tagPath !== ''}
    <Text size="small">{$t('tag_full_path', { values: { tag: tagPath } })}{tagName}</Text>
  {/if}
</FormModal>
