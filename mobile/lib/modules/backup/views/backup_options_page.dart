import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/backup/services/backup_verification.service.dart';
import 'package:immich_mobile/modules/backup/ui/ios_debug_info_tile.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class BackupOptionsPage extends HookConsumerWidget {
  const BackupOptionsPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    final settings = ref.watch(iOSBackgroundSettingsProvider.notifier).settings;
    final settingsService = ref.watch(appSettingsServiceProvider);
    final showBackupFix = Platform.isAndroid &&
        settingsService.getSetting(AppSettingsEnum.advancedTroubleshooting);
    final ignoreIcloudAssets = useState(
      settingsService.getSetting(AppSettingsEnum.ignoreIcloudAssets),
    );
    final appRefreshDisabled =
        Platform.isIOS && settings?.appRefreshEnabled != true;
    final checkInProgress = useState(false);

    Future<void> performDeletion(List<Asset> assets) async {
      try {
        checkInProgress.value = true;
        ImmichToast.show(
          context: context,
          msg: "Deleting ${assets.length} assets on the server...",
        );
        await ref
            .read(assetProvider.notifier)
            .deleteAssets(assets, force: true);
        ImmichToast.show(
          context: context,
          msg: "Deleted ${assets.length} assets on the server. "
              "You can now start a manual backup",
          toastType: ToastType.success,
        );
      } finally {
        checkInProgress.value = false;
      }
    }

    void performBackupCheck() async {
      try {
        checkInProgress.value = true;
        if (backupState.allUniqueAssets.length >
            backupState.selectedAlbumsBackupAssetsIds.length) {
          ImmichToast.show(
            context: context,
            msg: "Backup all assets before starting this check!",
            toastType: ToastType.error,
          );
          return;
        }
        final connection = await Connectivity().checkConnectivity();
        if (connection != ConnectivityResult.wifi) {
          ImmichToast.show(
            context: context,
            msg: "Make sure to be connected to unmetered Wi-Fi",
            toastType: ToastType.error,
          );
          return;
        }
        WakelockPlus.enable();
        const limit = 100;
        final toDelete = await ref
            .read(backupVerificationServiceProvider)
            .findWronglyBackedUpAssets(limit: limit);
        if (toDelete.isEmpty) {
          ImmichToast.show(
            context: context,
            msg: "Did not find any corrupt asset backups!",
            toastType: ToastType.success,
          );
        } else {
          await showDialog(
            context: context,
            builder: (context) => ConfirmDialog(
              onOk: () => performDeletion(toDelete),
              title: "Corrupt backups!",
              ok: "Delete",
              content:
                  "Found ${toDelete.length} (max $limit at once) corrupt asset backups. "
                  "Run the check again to find more.\n"
                  "Do you want to delete the corrupt asset backups now?",
            ),
          );
        }
      } finally {
        WakelockPlus.disable();
        checkInProgress.value = false;
      }
    }

    Widget buildCheckCorruptBackups() {
      return ListTile(
        leading: Icon(
          Icons.warning_rounded,
          color: context.primaryColor,
        ),
        title: const Text(
          "Check for corrupt asset backups",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        isThreeLine: true,
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Run this check only over Wi-Fi and once all assets "
                "have been backed-up. The procedure might take a few minutes."),
            ElevatedButton(
              onPressed: checkInProgress.value ? null : performBackupCheck,
              child: checkInProgress.value
                  ? const CircularProgressIndicator()
                  : const Text("Perform check"),
            ),
          ],
        ),
      );
    }

    void showErrorToUser(String msg) {
      final snackBar = SnackBar(
        content: Text(
          msg.tr(),
          style: context.textTheme.bodyLarge?.copyWith(
            color: context.primaryColor,
          ),
        ),
        backgroundColor: Colors.red,
      );
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    }

    void showBatteryOptimizationInfoToUser() {
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text(
              'backup_controller_page_background_battery_info_title',
            ).tr(),
            content: SingleChildScrollView(
              child: const Text(
                'backup_controller_page_background_battery_info_message',
              ).tr(),
            ),
            actions: [
              ElevatedButton(
                onPressed: () => launchUrl(
                  Uri.parse('https://dontkillmyapp.com'),
                  mode: LaunchMode.externalApplication,
                ),
                child: const Text(
                  "backup_controller_page_background_battery_info_link",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).tr(),
              ),
              ElevatedButton(
                child: const Text(
                  'backup_controller_page_background_battery_info_ok',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).tr(),
                onPressed: () {
                  context.pop();
                },
              ),
            ],
          );
        },
      );
    }

    Widget buildBackgroundBackupController() {
      final bool isBackgroundEnabled = backupState.backgroundBackup;
      final bool isWifiRequired = backupState.backupRequireWifi;
      final bool isChargingRequired = backupState.backupRequireCharging;
      final Color activeColor = context.primaryColor;

      String formatBackupDelaySliderValue(double v) {
        if (v == 0.0) {
          return 'setting_notifications_notify_seconds'.tr(args: const ['5']);
        } else if (v == 1.0) {
          return 'setting_notifications_notify_seconds'.tr(args: const ['30']);
        } else if (v == 2.0) {
          return 'setting_notifications_notify_minutes'.tr(args: const ['2']);
        } else {
          return 'setting_notifications_notify_minutes'.tr(args: const ['10']);
        }
      }

      int backupDelayToMilliseconds(double v) {
        if (v == 0.0) {
          return 5000;
        } else if (v == 1.0) {
          return 30000;
        } else if (v == 2.0) {
          return 120000;
        } else {
          return 600000;
        }
      }

      double backupDelayToSliderValue(int ms) {
        if (ms == 5000) {
          return 0.0;
        } else if (ms == 30000) {
          return 1.0;
        } else if (ms == 120000) {
          return 2.0;
        } else {
          return 3.0;
        }
      }

      final triggerDelay =
          useState(backupDelayToSliderValue(backupState.backupTriggerDelay));

      return Column(
        children: [
          ListTile(
            isThreeLine: true,
            leading: isBackgroundEnabled
                ? Icon(
                    Icons.cloud_sync_rounded,
                    color: activeColor,
                  )
                : const Icon(Icons.cloud_sync_rounded),
            title: Text(
              isBackgroundEnabled
                  ? "backup_controller_page_background_is_on"
                  : "backup_controller_page_background_is_off",
              style: context.textTheme.titleSmall,
            ).tr(),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isBackgroundEnabled)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: const Text(
                      "backup_controller_page_background_description",
                    ).tr(),
                  ),
                if (isBackgroundEnabled)
                  SwitchListTile.adaptive(
                    title: const Text("backup_controller_page_background_wifi")
                        .tr(),
                    secondary: Icon(
                      Icons.wifi,
                      color: isWifiRequired ? activeColor : null,
                    ),
                    dense: true,
                    activeColor: activeColor,
                    value: isWifiRequired,
                    onChanged: (isChecked) => ref
                        .read(backupProvider.notifier)
                        .configureBackgroundBackup(
                          requireWifi: isChecked,
                          onError: showErrorToUser,
                          onBatteryInfo: showBatteryOptimizationInfoToUser,
                        ),
                  ),
                if (isBackgroundEnabled)
                  SwitchListTile.adaptive(
                    title:
                        const Text("backup_controller_page_background_charging")
                            .tr(),
                    secondary: Icon(
                      Icons.charging_station,
                      color: isChargingRequired ? activeColor : null,
                    ),
                    dense: true,
                    activeColor: activeColor,
                    value: isChargingRequired,
                    onChanged: (isChecked) => ref
                        .read(backupProvider.notifier)
                        .configureBackgroundBackup(
                          requireCharging: isChecked,
                          onError: showErrorToUser,
                          onBatteryInfo: showBatteryOptimizationInfoToUser,
                        ),
                  ),
                if (isBackgroundEnabled && Platform.isAndroid)
                  ListTile(
                    isThreeLine: false,
                    dense: true,
                    title: const Text(
                      'backup_controller_page_background_delay',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ).tr(
                      args: [formatBackupDelaySliderValue(triggerDelay.value)],
                    ),
                    subtitle: Slider(
                      value: triggerDelay.value,
                      onChanged: (double v) => triggerDelay.value = v,
                      onChangeEnd: (double v) => ref
                          .read(backupProvider.notifier)
                          .configureBackgroundBackup(
                            triggerDelay: backupDelayToMilliseconds(v),
                            onError: showErrorToUser,
                            onBatteryInfo: showBatteryOptimizationInfoToUser,
                          ),
                      max: 3.0,
                      divisions: 3,
                      label: formatBackupDelaySliderValue(triggerDelay.value),
                      activeColor: context.primaryColor,
                    ),
                  ),
                ElevatedButton(
                  onPressed: () => ref
                      .read(backupProvider.notifier)
                      .configureBackgroundBackup(
                        enabled: !isBackgroundEnabled,
                        onError: showErrorToUser,
                        onBatteryInfo: showBatteryOptimizationInfoToUser,
                      ),
                  child: Text(
                    isBackgroundEnabled
                        ? "backup_controller_page_background_turn_off"
                        : "backup_controller_page_background_turn_on",
                    style: context.textTheme.labelLarge?.copyWith(
                      color: context.isDarkTheme ? Colors.black : Colors.white,
                    ),
                  ).tr(),
                ),
              ],
            ),
          ),
          if (isBackgroundEnabled && Platform.isIOS)
            FutureBuilder(
              future: ref
                  .read(backgroundServiceProvider)
                  .getIOSBackgroundAppRefreshEnabled(),
              builder: (context, snapshot) {
                final enabled = snapshot.data;
                // If it's not enabled, show them some kind of alert that says
                // background refresh is not enabled
                if (enabled != null && !enabled) {}
                // If it's enabled, no need to bother them
                return Container();
              },
            ),
          if (Platform.isIOS && isBackgroundEnabled && settings != null)
            IosDebugInfoTile(
              settings: settings,
            ),
        ],
      );
    }

    Widget buildBackgroundAppRefreshWarning() {
      return ListTile(
        isThreeLine: true,
        leading: const Icon(
          Icons.task_outlined,
        ),
        title: const Text(
          'backup_controller_page_background_app_refresh_disabled_title',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ).tr(),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: const Text(
                'backup_controller_page_background_app_refresh_disabled_content',
              ).tr(),
            ),
            ElevatedButton(
              onPressed: () => openAppSettings(),
              child: const Text(
                'backup_controller_page_background_app_refresh_enable_button_text',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ).tr(),
            ),
          ],
        ),
      );
    }

    ListTile buildAutoBackupController() {
      final isAutoBackup = backupState.autoBackup;
      final backUpOption = isAutoBackup
          ? "backup_controller_page_status_on".tr()
          : "backup_controller_page_status_off".tr();
      final backupBtnText = isAutoBackup
          ? "backup_controller_page_turn_off".tr()
          : "backup_controller_page_turn_on".tr();
      return ListTile(
        isThreeLine: true,
        leading: isAutoBackup
            ? Icon(
                Icons.cloud_done_rounded,
                color: context.primaryColor,
              )
            : const Icon(Icons.cloud_off_rounded),
        title: Text(
          backUpOption,
          style: context.textTheme.titleSmall,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isAutoBackup)
                const Text(
                  "backup_controller_page_desc_backup",
                ).tr(),
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: ElevatedButton(
                  onPressed: () => ref
                      .read(backupProvider.notifier)
                      .setAutoBackup(!isAutoBackup),
                  child: Text(
                    backupBtnText,
                    style: context.textTheme.labelLarge?.copyWith(
                      color: context.isDarkTheme ? Colors.black : Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    void switchChanged(bool value) {
      settingsService.setSetting(AppSettingsEnum.ignoreIcloudAssets, value);
      ignoreIcloudAssets.value = value;
      ref.invalidate(appSettingsServiceProvider);
    }

    buildIgnoreIcloudAssetSetting() {
      return [
        const Divider(),
        SwitchListTile.adaptive(
          title: const Text(
            "Ignore iCloud photos",
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: const Text(
            "Photos that are stored on iCloud will not be uploaded to the Immich server",
          ),
          value: ignoreIcloudAssets.value,
          onChanged: switchChanged,
        ),
      ];
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "Backup options",
        ),
        leading: IconButton(
          onPressed: () => context.popRoute(true),
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 32.0),
        child: ListView(
          children: [
            buildAutoBackupController(),
            const Divider(),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              child: Platform.isIOS
                  ? (appRefreshDisabled
                      ? buildBackgroundAppRefreshWarning()
                      : buildBackgroundBackupController())
                  : buildBackgroundBackupController(),
            ),
            if (Platform.isIOS) ...buildIgnoreIcloudAssetSetting(),
            if (showBackupFix) const Divider(),
            if (showBackupFix) buildCheckCorruptBackups(),
          ],
        ),
      ),
    );
  }
}
