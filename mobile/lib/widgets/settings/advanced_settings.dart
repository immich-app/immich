import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/platform/cloud_provider_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/beta_timeline_list_tile.dart';
import 'package:immich_mobile/widgets/settings/custom_proxy_headers_settings/custom_proxy_headers_settings.dart';
import 'package:immich_mobile/widgets/settings/local_storage_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_action_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/ssl_client_cert_settings.dart';
import 'package:logging/logging.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advancedTroubleshooting = useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final manageLocalMediaAndroid = useAppSettingsState(AppSettingsEnum.manageLocalMediaAndroid);
    final isManageMediaSupported = useState(false);
    final manageMediaAndroidPermission = useState(false);
    final levelId = useAppSettingsState(AppSettingsEnum.logLevel);
    final preferRemote = useAppSettingsState(AppSettingsEnum.preferRemoteImage);
    final useAlternatePMFilter = useAppSettingsState(AppSettingsEnum.photoManagerCustomFilter);
    final readonlyModeEnabled = useAppSettingsState(AppSettingsEnum.readonlyModeEnabled);

    final logLevel = Level.LEVELS[levelId.value].name;

    useValueChanged(levelId.value, (_, __) => LogService.I.setLogLevel(Level.LEVELS[levelId.value].toLogLevel()));

    Future<bool> checkAndroidVersion() async {
      if (Platform.isAndroid) {
        DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
        AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
        int sdkVersion = androidInfo.version.sdkInt;
        return sdkVersion >= 31;
      }
      return false;
    }

    useEffect(() {
      () async {
        isManageMediaSupported.value = await checkAndroidVersion();
        if (isManageMediaSupported.value) {
          manageMediaAndroidPermission.value = await ref
              .read(localFilesManagerRepositoryProvider)
              .hasManageMediaPermission();
        }
      }();
      return null;
    }, []);

    final isCloudProviderSupported = useState(false);
    final cloudProviderAdbCommand = useState('');
    final cloudProviderAdbDisableCommand = useState('');

    useEffect(() {
      if (Platform.isAndroid) {
        () async {
          final deviceInfo = DeviceInfoPlugin();
          final androidInfo = await deviceInfo.androidInfo;
          if (androidInfo.version.sdkInt >= 34) {
            isCloudProviderSupported.value = true;
            try {
              final api = CloudProviderApi();
              cloudProviderAdbCommand.value = await api.getAdbSetupCommand();
              cloudProviderAdbDisableCommand.value = await api.getAdbDisableCommand();
            } catch (_) {}
          }
        }();
      }
      return null;
    }, []);

    final advancedSettings = [
      SettingsSwitchListTile(
        enabled: true,
        valueNotifier: advancedTroubleshooting,
        title: "advanced_settings_troubleshooting_title".tr(),
        subtitle: "advanced_settings_troubleshooting_subtitle".tr(),
      ),
      if (isManageMediaSupported.value)
        Column(
          children: [
            SettingsSwitchListTile(
              enabled: true,
              valueNotifier: manageLocalMediaAndroid,
              title: "advanced_settings_sync_remote_deletions_title".tr(),
              subtitle: "advanced_settings_sync_remote_deletions_subtitle".tr(),
              onChanged: (value) async {
                if (value) {
                  final result = await ref.read(localFilesManagerRepositoryProvider).requestManageMediaPermission();
                  manageLocalMediaAndroid.value = result;
                  manageMediaAndroidPermission.value = result;
                }
              },
            ),
            SettingsActionTile(
              title: "manage_media_access_title".tr(),
              statusText: manageMediaAndroidPermission.value ? "allowed".tr() : "not_allowed".tr(),
              subtitle: "manage_media_access_rationale".tr(),
              statusColor: manageLocalMediaAndroid.value && !manageMediaAndroidPermission.value
                  ? const Color.fromARGB(255, 243, 188, 106)
                  : null,
              onActionTap: () async {
                final result = await ref.read(localFilesManagerRepositoryProvider).manageMediaPermission();
                manageMediaAndroidPermission.value = result;
              },
            ),
          ],
        ),
      if (isCloudProviderSupported.value)
        _CloudProviderTile(
          adbEnableCommand: cloudProviderAdbCommand.value,
          adbDisableCommand: cloudProviderAdbDisableCommand.value,
        ),
      SettingsSliderListTile(
        text: "advanced_settings_log_level_title".tr(namedArgs: {'level': logLevel}),
        valueNotifier: levelId,
        maxValue: 8,
        minValue: 1,
        noDivisons: 7,
        label: logLevel,
      ),
      SettingsSwitchListTile(
        valueNotifier: preferRemote,
        title: "advanced_settings_prefer_remote_title".tr(),
        subtitle: "advanced_settings_prefer_remote_subtitle".tr(),
      ),
      if (!Store.isBetaTimelineEnabled) const LocalStorageSettings(),
      const CustomProxyHeaderSettings(),
      const SslClientCertSettings(),
      if (!Store.isBetaTimelineEnabled)
        SettingsSwitchListTile(
          valueNotifier: useAlternatePMFilter,
          title: "advanced_settings_enable_alternate_media_filter_title".tr(),
          subtitle: "advanced_settings_enable_alternate_media_filter_subtitle".tr(),
        ),
      if (!Store.isBetaTimelineEnabled) const BetaTimelineListTile(),
      if (Store.isBetaTimelineEnabled)
        SettingsSwitchListTile(
          valueNotifier: readonlyModeEnabled,
          title: "advanced_settings_readonly_mode_title".tr(),
          subtitle: "advanced_settings_readonly_mode_subtitle".tr(),
          onChanged: (value) {
            readonlyModeEnabled.value = value;
            ref.read(readonlyModeProvider.notifier).setReadonlyMode(value);
            context.scaffoldMessenger.showSnackBar(
              SnackBar(
                duration: const Duration(seconds: 2),
                content: Text(
                  (value ? "readonly_mode_enabled" : "readonly_mode_disabled").tr(),
                  style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
                ),
              ),
            );
          },
        ),
      ListTile(
        title: Text("advanced_settings_clear_image_cache".tr(), style: const TextStyle(fontWeight: FontWeight.w500)),
        leading: const Icon(Icons.playlist_remove_rounded),
        onTap: () async {
          final int clearedBytes;
          try {
            clearedBytes = await remoteImageApi.clearCache();
          } catch (e) {
            context.scaffoldMessenger.showSnackBar(
              SnackBar(
                duration: const Duration(seconds: 2),
                content: Text(
                  "advanced_settings_clear_image_cache_error".tr(),
                  style: context.textTheme.bodyLarge?.copyWith(color: context.themeData.colorScheme.error),
                ),
              ),
            );
            return;
          }

          if (clearedBytes < 0) {
            return;
          }

          // iOS always returns a small non-zero value
          final clearedMB = clearedBytes < (256 * 1024) ? "0 MiB" : formatHumanReadableBytes(clearedBytes, 2);
          context.scaffoldMessenger.showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 2),
              content: Text(
                "advanced_settings_clear_image_cache_success".tr(namedArgs: {'size': clearedMB}),
                style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
              ),
            ),
          );
        },
      ),
      const SizedBox(height: 60),
    ];

    return SettingsSubPageScaffold(settings: advancedSettings);
  }
}

class _CloudProviderTile extends StatelessWidget {
  final String adbEnableCommand;
  final String adbDisableCommand;

  const _CloudProviderTile({required this.adbEnableCommand, required this.adbDisableCommand});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'advanced_settings_cloud_provider_title'.tr(),
            style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500, height: 1.5),
          ),
          const SizedBox(height: 4),
          Text(
            'advanced_settings_cloud_provider_description'.tr(),
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          _CommandBlock(label: 'advanced_settings_cloud_provider_enable_label'.tr(), command: adbEnableCommand),
          const SizedBox(height: 8),
          _CommandBlock(label: 'advanced_settings_cloud_provider_disable_label'.tr(), command: adbDisableCommand),
          const SizedBox(height: 8),
          Text(
            'advanced_settings_cloud_provider_help'.tr(),
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _CommandBlock extends StatelessWidget {
  final String label;
  final String command;

  const _CommandBlock({required this.label, required this.command});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  command,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy, size: 18),
                visualDensity: VisualDensity.compact,
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: command));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('advanced_settings_cloud_provider_copied'.tr()),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
