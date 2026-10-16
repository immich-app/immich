import type { AdminConfigDto, ServerFeaturesDto } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';
import { mdiContentCopy, mdiDownload, mdiUpload } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { executeMutation } from '$lib/queries/client';
import { updateConfigMutation } from '$lib/queries/system-config.query';
import { copyToClipboard, downloadJson } from '$lib/utils';

export const getSystemConfigActions = (
  $t: MessageFormatter,
  featureFlags: ServerFeaturesDto,
  config: AdminConfigDto,
) => {
  const CopyToClipboard: ActionItem = {
    title: $t('copy_to_clipboard'),
    description: $t('admin.copy_config_to_clipboard_description'),
    icon: mdiContentCopy,
    onAction: () => copyToClipboard(config),
    shortcuts: { shift: true, key: 'c' },
  };

  const Download: ActionItem = {
    title: $t('export_as_json'),
    description: $t('admin.export_config_as_json_description'),
    icon: mdiDownload,
    onAction: () => downloadJson(config, 'immich-config.json'),
    shortcuts: [
      { shift: true, key: 's' },
      { shift: true, key: 'd' },
    ],
  };

  const Upload: ActionItem = {
    title: $t('import_from_json'),
    description: $t('admin.import_config_from_json_description'),
    icon: mdiUpload,
    $if: () => !featureFlags.configFile,
    onAction: () => handleUploadConfig(),
    shortcuts: { shift: true, key: 'u' },
  };

  return { CopyToClipboard, Download, Upload };
};

const handleUploadConfig = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', '.json');
  input.setAttribute('style', 'display: none');

  input.addEventListener('change', ({ target }) => {
    const file = (target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = async () => {
      const text = await file.text();
      await executeMutation(updateConfigMutation(), JSON.parse(text));
    };
    reader()
      .catch((error) => console.error('Error handling JSON config upload', error))
      .finally(() => input.remove());
  });
  document.body.append(input);
  input.click();
};
