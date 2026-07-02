import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/custom_proxy_headers_settings/custom_proxy_headers_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_action_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/ssl_client_cert_settings.dart';
import 'package:logging/logging.dart';

class AdvancedSettings extends HookConsumerWidget {
  const AdvancedSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advancedTroubleshooting = useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final isManageMediaSupported = useState(false);
    final levelId = useState<int>(ref.read(appConfigProvider).logLevel.index);
    final preferRemote = useState(ref.read(appConfigProvider).image.preferRemote);
    useValueChanged(
      preferRemote.value,
      (_, __) => ref.read(settingsProvider).write(.imagePreferRemote, preferRemote.value),
    );
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
      }();
      return null;
    }, []);

    final advancedSettings = [
      SettingsSwitchListTile(
        enabled: true,
        valueNotifier: advancedTroubleshooting,
        title: "advanced_settings_troubleshooting_title".tr(),
        subtitle: "advanced_settings_troubleshooting_subtitle".tr(),
      ),
      // Android 12+: full selector (Off / Auto sync / Review) + MANAGE_MEDIA tile.
      // iOS:          reduced selector (Off / Review) — no MANAGE_MEDIA on this
      //               platform; auto-sync is dropped because PhotoKit prompts on
      //               every batch, which would defeat the "set and forget" intent.
      if (isManageMediaSupported.value || Platform.isIOS) const _TrashSyncModeSelector(),
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
      const CustomProxyHeaderSettings(),
      const SslClientCertSettings(),
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

final _manageMediaPermissionProvider = FutureProvider<bool>((ref) async {
  return ref.watch(permissionRepositoryProvider).hasManageMediaPermission();
});

class _TrashSyncModeSelector extends HookConsumerWidget {
  const _TrashSyncModeSelector();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedTrashSyncMode = ref.watch(appConfigProvider.select((config) => config.trashSync.mode));

    final manageMediaAndroidPermission = ref.watch(_manageMediaPermissionProvider);
    final manageMediaAndroidPermissionValue = manageMediaAndroidPermission.valueOrNull;
    final isTrashSyncEnabled = selectedTrashSyncMode != TrashSyncMode.off;
    final reviewRemoteDeletionsSubtitle = [
      "advanced_settings_review_remote_deletions_subtitle".tr(),
      if (Platform.isAndroid) "advanced_settings_review_remote_deletions_subtitle_android".tr(),
    ].join(' ');

    void showManageMediaRequiredSnackBar() {
      if (!context.mounted) {
        return;
      }
      context.scaffoldMessenger.showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 3),
          content: Text(
            "manage_media_access_review_rationale".tr(),
            style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
          ),
        ),
      );
    }

    Future<void> setTrashSyncMode(TrashSyncMode mode) {
      return ref.read(settingsProvider).write(.trashSyncMode, mode);
    }

    Future<void> attemptToEnableSetting(TrashSyncMode mode) async {
      if (Platform.isIOS) {
        // No MANAGE_MEDIA on iOS; review is the only mode the user can pick.
        if (mode == TrashSyncMode.review) {
          await setTrashSyncMode(TrashSyncMode.review);
        }
        return;
      }
      final result = await ref.read(permissionRepositoryProvider).requestManageMediaPermission();
      ref.invalidate(_manageMediaPermissionProvider);
      if (mode == TrashSyncMode.autoSync && result) {
        await setTrashSyncMode(TrashSyncMode.autoSync);
      }
      if (mode == TrashSyncMode.review) {
        await setTrashSyncMode(TrashSyncMode.review);
        if (!result) {
          showManageMediaRequiredSnackBar();
        }
      }
    }

    Future<void> handleTrashSyncModeChange(TrashSyncMode? mode) async {
      if (mode == null || mode == selectedTrashSyncMode) {
        return;
      }

      if (mode == TrashSyncMode.off) {
        await setTrashSyncMode(TrashSyncMode.off);
        return;
      }

      await attemptToEnableSetting(mode);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "advanced_settings_sync_remote_deletions_selector_title".tr()),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'off'.tr(),
              subtitle: 'advanced_settings_sync_remote_deletions_off_subtitle'.tr(),
              value: TrashSyncMode.off,
            ),
            // Auto-sync requires MANAGE_MEDIA to run silently. iOS has no
            // equivalent permission and every batch would trigger a PhotoKit
            // prompt — so the auto mode is intentionally hidden there.
            if (!Platform.isIOS)
              SettingsRadioGroup(
                title: 'advanced_settings_sync_remote_deletions_title'.tr(),
                subtitle: 'advanced_settings_sync_remote_deletions_subtitle'.tr(),
                value: TrashSyncMode.autoSync,
              ),
            SettingsRadioGroup(
              title: 'advanced_settings_review_remote_deletions_title'.tr(),
              subtitle: reviewRemoteDeletionsSubtitle,
              value: TrashSyncMode.review,
            ),
          ],
          groupBy: selectedTrashSyncMode,
          onRadioChanged: handleTrashSyncModeChange,
        ),
        // MANAGE_MEDIA permission tile is Android-only; iOS has no equivalent.
        if (Platform.isAndroid)
          SettingsActionTile(
            title: "manage_media_access_title".tr(),
            statusText: manageMediaAndroidPermissionValue == null
                ? null
                : manageMediaAndroidPermissionValue == true
                ? "allowed".tr()
                : "not_allowed".tr(),
            subtitle: "manage_media_access_rationale".tr(),
            statusColor: manageMediaAndroidPermissionValue == false && isTrashSyncEnabled
                ? const Color.fromARGB(255, 243, 188, 106)
                : null,
            onActionTap: () async {
              await ref.read(permissionRepositoryProvider).manageMediaPermission();
              ref.invalidate(_manageMediaPermissionProvider);
            },
          ),
      ],
    );
  }
}
