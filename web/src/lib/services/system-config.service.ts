import { AppRoute } from '$lib/constants';
import { downloadManager } from '$lib/managers/download-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AuthDisableLoginConfirmModal from '$lib/modals/AuthDisableLoginConfirmModal.svelte';
import type { SystemConfigContext } from '$lib/types';
import { copyToClipboard } from '$lib/utils';
import { downloadBlob } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { getConfig, unlinkAllOAuthAccountsAdmin, updateConfig, type ServerFeaturesDto, type SystemConfigDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAccountOutline,
  mdiBackupRestore,
  mdiBellOutline,
  mdiBookshelf,
  mdiClockOutline,
  mdiContentCopy,
  mdiDatabaseOutline,
  mdiDownload,
  mdiFileDocumentOutline,
  mdiFolderOutline,
  mdiLockOutline,
  mdiMapMarkerOutline,
  mdiPaletteOutline,
  mdiRestart,
  mdiRobotOutline,
  mdiServerOutline,
  mdiSync,
  mdiTrashCanOutline,
  mdiUpdate,
  mdiUpload,
  mdiVideoOutline
} from '@mdi/js';
import { isEqual } from 'lodash-es';
import type { MessageFormatter } from 'svelte-i18n';

type SettingsGroup = {
  title: string,
  subtitle?: string;
  items: SettingItem[];
}

type SettingItem = {
  title: string; subtitle: string; href: string; icon: string;
};

export const resolveSetting = (groups: SettingsGroup[], pathname: string) => {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return item;
      }
    }
  }
}

export const getSystemConfigActions = (
  $t: MessageFormatter,
  featureFlags: ServerFeaturesDto,
  config: SystemConfigDto,
) => {
  const settings: SettingsGroup[] = [
    {

          title: $t('admin.authentication_settings'),
          subtitle: $t('admin.authentication_settings_description'),

      items: [
        {
title:$t('admin.password_settings'), subtitle: $t('admin.password_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/password`,
          icon: mdiLockOutline,
        },
        {

          title:$t('admin.oauth_settings'), subtitle:$t('admin.oauth_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/oauth`,
          icon: mdiFileDocumentOutline,
        },
      ]
    },
    {
      title: 'General', items: [
        // {
        //   title: $t('admin.image_settings'),
        //   subtitle: $t('admin.image_settings_description'),
        //   href: `${AppRoute.ADMIN_SETTINGS}/image`,
        //   icon: mdiImageOutline,
        // },
        {
          title: $t('admin.library_settings'),
          subtitle: $t('admin.library_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/library`,
          icon: mdiBookshelf,
        },
        // {
        //   title: $t('admin.maintenance_settings'),
        //   subtitle: $t('admin.maintenance_settings_description'),
        //   href: `${AppRoute.ADMIN_SETTINGS}/maintenance`,
        //   icon: mdiRestore,
        // },
        {
          title: $t('admin.map_gps_settings'),
          subtitle: $t('admin.map_gps_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/location`,
          icon: mdiMapMarkerOutline,
        },
        {
          title: $t('admin.metadata_settings'),
          subtitle: $t('admin.metadata_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/metadata`,
          icon: mdiDatabaseOutline,
        },
        {
          title: $t('admin.notification_settings'),
          subtitle: $t('admin.notification_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/notifications`,
          icon: mdiBellOutline,
        },
        {
          title: $t('admin.storage_template_settings'),
          subtitle: $t('admin.storage_template_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/storage-template`,
          icon: mdiFolderOutline,
        },
        {
          title: $t('admin.theme_settings'),
          subtitle: $t('admin.theme_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/theme`,
          icon: mdiPaletteOutline,
        },
        {
          title: $t('admin.trash_settings'),
          subtitle: $t('admin.trash_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/trash`,
          icon: mdiTrashCanOutline,
        },
        {
          title: $t('admin.user_settings'),
          subtitle: $t('admin.user_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/user`,
          icon: mdiAccountOutline,
        },
      ]
    },


    {
      title: 'Image', items: [
        {
          title: 'General settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Thumbnail settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Preview settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Full-size settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
      ]
    },
    {
      title: 'Video', items: [
        {
          title: 'General settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Transcoding Policies',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Hardware Acceleration',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Encoding Options',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: $t('admin.transcoding_settings'),
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
        {
          title: 'Advanced Settings',
          subtitle: $t('admin.transcoding_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/video-transcoding`,
          icon: mdiVideoOutline,
        },
      ]
    },

    {
      title: 'Machine learning', items: [
        {
          title: 'Connection settings',
          subtitle: $t('admin.machine_learning_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
          icon: mdiRobotOutline,
        },
        // {
        //   title: $t('admin.machine_learning_settings'),
        //   subtitle: $t('admin.machine_learning_settings_description'),
        //   href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
        //   icon: mdiRobotOutline,
        // },
        {
          title: 'Search',
          subtitle: $t('admin.machine_learning_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
          icon: mdiRobotOutline,
        },
        {
          title: 'Duplicate Detection',
          subtitle: $t('admin.machine_learning_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
          icon: mdiRobotOutline,
        },
        {
          title: 'Facial Recognition',
          subtitle: $t('admin.machine_learning_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
          icon: mdiRobotOutline,
        },
        {
          title: 'OCR',
          subtitle: $t('admin.machine_learning_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/machine-learning`,
          icon: mdiRobotOutline,
        },
      ]
    },

    {
      title: 'Job settings', items: [
        {
          title: 'General settings',
          subtitle: $t('admin.server_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/server`,
          icon: mdiServerOutline,
        },
        {
          title: $t('admin.nightly_tasks_settings'),
          subtitle: $t('admin.nightly_tasks_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/nightly-tasks`,
          icon: mdiClockOutline,
        },

      ]
    },
    {
      title: 'Server settings', items: [
        {
          title: 'General settings',
          subtitle: $t('admin.server_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/server`,
          icon: mdiServerOutline,
        },
        {
          title: $t('admin.authentication_settings'),
          subtitle: $t('admin.authentication_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/authentication`,
          icon: mdiLockOutline,
        },

        {
          title: $t('admin.job_settings'),
          subtitle: $t('admin.job_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/job`,
          icon: mdiSync,
        },
        {
          title: $t('admin.backup_settings'),
          subtitle: $t('admin.backup_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/backup`,
          icon: mdiBackupRestore,
        },
        {
          title: $t('admin.version_check_settings'),
          subtitle: $t('admin.version_check_settings_description'),
          href: `${AppRoute.ADMIN_SETTINGS}/version-check`,
          icon: mdiUpdate,
        },
      ]
    },
  ];

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

  return { settings, CopyToClipboard, Download, Upload };
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
  input.setAttribute('accept', 'json');
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
    reader().catch((error) => console.error('Error handling JSON config upload', error));
    globalThis.document.append(input);
  });
  input.remove();
};


export const  handleUnlinkAllOAuthAccounts = async () => {
  const $t = await getFormatter();
    const confirmed = await modalManager.showDialog({
      icon: mdiRestart,
      title: $t('admin.unlink_all_oauth_accounts'),
      prompt: $t('admin.unlink_all_oauth_accounts_prompt'),
      confirmColor: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await unlinkAllOAuthAccountsAdmin();
      toastManager.success();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };


export  const onBeforeSave = async ({ configToEdit }: SystemConfigContext) => {
    const allMethodsDisabled = !configToEdit.oauth.enabled && !configToEdit.passwordLogin.enabled;
    if (allMethodsDisabled) {
      const isConfirmed = await modalManager.show(AuthDisableLoginConfirmModal, {});
      if (!isConfirmed) {
        return false;
      }
    }

    return true;
  };
