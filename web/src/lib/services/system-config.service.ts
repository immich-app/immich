import { downloadManager } from '$lib/managers/download-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { copyToClipboard } from '$lib/utils';
import { downloadBlob } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { getConfig, updateConfig, type ServerFeaturesDto, type SystemConfigDto } from '@immich/sdk';
import { toastManager, type ActionItem } from '@immich/ui';
import { mdiContentCopy, mdiDownload, mdiUpload } from '@mdi/js';
import { isEqual } from 'lodash-es';
import type { MessageFormatter } from 'svelte-i18n';

export const getSystemConfigActions = (
  $t: MessageFormatter,
  featureFlags: ServerFeaturesDto,
  config: SystemConfigDto,
) => {
  const CopyToClipboard: ActionItem = {
    title: $t('copy_to_clipboard'),
    description: $t('admin.copy_config_to_clipboard_description'),
    type: $t('command'),
    icon: mdiContentCopy,
    onAction: () => handleCopyToClipboard(config),
    shortcuts: { shift: true, key: 'c' },
  };

  const Download: ActionItem = {
    title: $t('export_as_json'),
    description: $t('admin.export_config_as_json_description'),
    type: $t('command'),
    icon: mdiDownload,
    onAction: () => handleDownloadConfig(config),
    shortcuts: [
      { shift: true, key: 's' },
      { shift: true, key: 'd' },
    ],
  };

  const Upload: ActionItem = {
    title: $t('import_from_json'),
    description: $t('admin.import_config_from_json_description'),
    type: $t('command'),
    icon: mdiUpload,
    $if: () => !featureFlags.configFile,
    onAction: () => handleUploadConfig(),
    shortcuts: { shift: true, key: 'u' },
  };

  return { CopyToClipboard, Download, Upload };
};

export const handleSystemConfigSave = async (update: Partial<SystemConfigDto>) => {
  const $t = await getFormatter();
  const config = await getConfig();
  const systemConfigDto = { ...config, ...update };

  if (isEqual(config, systemConfigDto)) {
    return;
  }

  try {
    const newConfig = await updateConfig({ systemConfigDto });

    eventManager.emit('SystemConfigUpdate', newConfig);
    toastManager.success($t('settings_saved'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_settings'));
  }
};

// https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify/43636793#43636793
const jsonReplacer = (_key: string, value: unknown) =>
  value instanceof Object && !Array.isArray(value)
    ? Object.keys(value)
        .sort()
        // eslint-disable-next-line unicorn/no-array-reduce
        .reduce((sorted: { [key: string]: unknown }, key) => {
          sorted[key] = (value as { [key: string]: unknown })[key];
          return sorted;
        }, {})
    : value;

export const handleCopyToClipboard = async (config: SystemConfigDto) => {
  await copyToClipboard(JSON.stringify(config, jsonReplacer, 2));
};

export const handleDownloadConfig = (config: SystemConfigDto) => {
  const blob = new Blob([JSON.stringify(config, jsonReplacer, 2)], { type: 'application/json' });
  const downloadKey = 'immich-config.json';
  downloadManager.add(downloadKey, blob.size);
  downloadManager.update(downloadKey, blob.size);
  downloadBlob(blob, downloadKey);
  setTimeout(() => downloadManager.clear(downloadKey), 5000);
};

export const handleUploadConfig = () => {
  const input = globalThis.document.createElement('input');
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
      const newConfig = JSON.parse(text);
      await handleSystemConfigSave(newConfig);
    };
    reader()
      .catch((error) => console.error('Error handling JSON config upload', error))
      .finally(() => input.remove());
  });
  globalThis.document.body.append(input);
  input.click();
};
