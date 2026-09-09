import 'dart:async';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/custom_proxy_headers_settings/custom_proxy_headers_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_action_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
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
    final isManageMediaSupported = useState(false);
    final levelId = useState<int>(ref.watch(appConfigProvider).logLevel.index);
    final preferRemote = useState(ref.watch(appConfigProvider).image.preferRemote);
    useValueChanged(
      preferRemote.value,
      (_, _) => unawaited(ref.read(settingsProvider).write(.imagePreferRemote, preferRemote.value)),
    );
    final readonlyModeEnabled = useAppSettingsState(AppSettingsEnum.readonlyModeEnabled);

    final logLevel = Level.LEVELS[levelId.value].name;

    useValueChanged(
      levelId.value,
      (_, _) => unawaited(LogService.I.setLogLevel(Level.LEVELS[levelId.value].toLogLevel())),
    );

    Future<bool> checkAndroidVersion() async {
      if (Platform.isAndroid) {
        final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
        final AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
        final int sdkVersion = androidInfo.version.sdkInt;
        return sdkVersion >= 31;
      }
      return false;
    }

    useEffect(() {
      unawaited(() async {
        isManageMediaSupported.value = await checkAndroidVersion();
      }());
      return null;
    }, []);

    final advancedSettings = [
      SettingsSwitchListTile(
        enabled: true,
        valueNotifier: advancedTroubleshooting,
        title: context.t.advanced_settings_troubleshooting_title,
        subtitle: context.t.advanced_settings_troubleshooting_subtitle,
      ),
      // iOS: reduced selector (Off / Review); auto-sync is not offered there.
      if (Platform.isIOS) const _IosTrashSyncModeSelector(),
      // Android 12+: full selector (Off / Auto sync / Review) + MANAGE_MEDIA tile.
      if (isManageMediaSupported.value) const _AndroidTrashSyncModeSelector(),
      SettingsSliderListTile(
        text: context.t.advanced_settings_log_level_title(level: logLevel),
        valueNotifier: levelId,
        maxValue: 8,
        minValue: 1,
        noDivisons: 7,
        label: logLevel,
      ),
      SettingsSwitchListTile(
        valueNotifier: preferRemote,
        title: context.t.advanced_settings_prefer_remote_title,
        subtitle: context.t.advanced_settings_prefer_remote_subtitle,
      ),
      const CustomProxyHeaderSettings(),
      const SslClientCertSettings(),
      SettingsSwitchListTile(
        valueNotifier: readonlyModeEnabled,
        title: context.t.advanced_settings_readonly_mode_title,
        subtitle: context.t.advanced_settings_readonly_mode_subtitle,
        onChanged: (value) {
          readonlyModeEnabled.value = value;
          ref.read(readonlyModeProvider.notifier).setReadonlyMode(value);
          context.scaffoldMessenger.showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 2),
              content: Text(
                value ? context.t.readonly_mode_enabled : context.t.readonly_mode_disabled,
                style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
              ),
            ),
          );
        },
      ),
      ListTile(
        title: Text(context.t.advanced_settings_clear_image_cache, style: const TextStyle(fontWeight: FontWeight.w500)),
        leading: const Icon(Icons.playlist_remove_rounded),
        onTap: () async {
          final int clearedBytes;
          try {
            clearedBytes = await remoteImageApi.clearCache();
          } catch (e) {
            if (!context.mounted) {
              return;
            }

            context.scaffoldMessenger.showSnackBar(
              SnackBar(
                duration: const Duration(seconds: 2),
                content: Text(
                  context.t.advanced_settings_clear_image_cache_error,
                  style: context.textTheme.bodyLarge?.copyWith(color: context.themeData.colorScheme.error),
                ),
              ),
            );
            return;
          }

          if (clearedBytes < 0 || !context.mounted) {
            return;
          }

          // iOS always returns a small non-zero value
          final clearedMB = clearedBytes < (256 * 1024) ? "0 MiB" : formatHumanReadableBytes(clearedBytes, 2);
          context.scaffoldMessenger.showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 2),
              content: Text(
                context.t.advanced_settings_clear_image_cache_success(size: clearedMB),
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

class _IosTrashSyncModeSelector extends ConsumerStatefulWidget {
  const _IosTrashSyncModeSelector();

  @override
  ConsumerState<_IosTrashSyncModeSelector> createState() => _IosTrashSyncModeSelectorState();
}

class _IosTrashSyncModeSelectorState extends ConsumerState<_IosTrashSyncModeSelector> {
  late final ValueNotifier<bool> _reviewRemoteDeletionsEnabled;

  @override
  void initState() {
    super.initState();
    _reviewRemoteDeletionsEnabled = ValueNotifier(ref.read(appConfigProvider).trashSyncMode != TrashSyncMode.off);
    ref.listenManual(appConfigProvider.select((config) => config.trashSyncMode), (_, mode) {
      _reviewRemoteDeletionsEnabled.value = mode != TrashSyncMode.off;
    });
  }

  @override
  void dispose() {
    _reviewRemoteDeletionsEnabled.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: _reviewRemoteDeletionsEnabled,
      builder: (context, _, _) => SettingsSwitchListTile(
        valueNotifier: _reviewRemoteDeletionsEnabled,
        title: context.t.advanced_settings_review_remote_deletions_title,
        subtitle: context.t.advanced_settings_review_remote_deletions_subtitle,
        onChanged: (enabled) =>
            ref.read(settingsProvider).write(.trashSyncMode, enabled ? TrashSyncMode.review : TrashSyncMode.off),
      ),
    );
  }
}

class _AndroidTrashSyncModeSelector extends ConsumerStatefulWidget {
  const _AndroidTrashSyncModeSelector();

  @override
  ConsumerState<_AndroidTrashSyncModeSelector> createState() => _AndroidTrashSyncModeSelectorState();
}

class _AndroidTrashSyncModeSelectorState extends ConsumerState<_AndroidTrashSyncModeSelector> {
  late final AppLifecycleListener _appLifecycleListener;
  bool? _hasManageMediaPermission;

  @override
  void initState() {
    super.initState();
    _appLifecycleListener = AppLifecycleListener(onResume: () => unawaited(_refreshManageMediaPermission()));
    unawaited(_refreshManageMediaPermission());
  }

  Future<void> _refreshManageMediaPermission() async {
    final hasPermission = await ref.read(permissionRepositoryProvider).hasManageMediaPermission();
    if (mounted) {
      setState(() => _hasManageMediaPermission = hasPermission);
    }
  }

  @override
  void dispose() {
    _appLifecycleListener.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedTrashSyncMode = ref.watch(appConfigProvider.select((config) => config.trashSyncMode));
    final isTrashSyncEnabled = selectedTrashSyncMode != TrashSyncMode.off;

    void showManageMediaRequiredSnackBar() {
      if (!context.mounted) {
        return;
      }
      context.scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text(
            context.t.manage_media_access_review_rationale,
            style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
          ),
        ),
      );
    }

    Future<void> setTrashSyncMode(TrashSyncMode mode) {
      return ref.read(settingsProvider).write(.trashSyncMode, mode);
    }

    Future<void> attemptToEnableSetting(TrashSyncMode mode) async {
      final result = await ref.read(permissionRepositoryProvider).requestManageMediaPermission();
      if (mounted) {
        setState(() => _hasManageMediaPermission = result);
      }

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
        Padding(
          padding: const EdgeInsets.only(left: 20),
          child: Text(
            context.t.advanced_settings_sync_remote_deletions_selector_title,
            style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500, height: 1.5),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 8),
          child: SettingsRadioListTile<TrashSyncMode>(
            groups: [
              SettingsRadioGroup(
                title: context.t.off,
                subtitle: context.t.advanced_settings_sync_remote_deletions_off_subtitle,
                value: TrashSyncMode.off,
              ),
              SettingsRadioGroup(
                title: context.t.advanced_settings_sync_remote_deletions_title,
                subtitle: context.t.advanced_settings_sync_remote_deletions_subtitle,
                value: TrashSyncMode.autoSync,
              ),
              SettingsRadioGroup(
                title: context.t.advanced_settings_review_remote_deletions_title,
                subtitle: context.t.advanced_settings_review_remote_deletions_subtitle_android,
                value: TrashSyncMode.review,
              ),
            ],
            groupBy: selectedTrashSyncMode,
            onRadioChanged: handleTrashSyncModeChange,
          ),
        ),
        SettingsActionTile(
          title: context.t.manage_media_access_title,
          statusText: _hasManageMediaPermission == null
              ? null
              : _hasManageMediaPermission == true
              ? context.t.allowed
              : context.t.not_allowed,
          subtitle: context.t.manage_media_access_rationale,
          statusColor: _hasManageMediaPermission == false && isTrashSyncEnabled
              ? const Color.fromARGB(255, 243, 188, 106)
              : null,
          onActionTap: () async {
            final hasPermission = await ref.read(permissionRepositoryProvider).manageMediaPermission();
            if (mounted) {
              setState(() => _hasManageMediaPermission = hasPermission);
            }
          },
        ),
      ],
    );
  }
}
