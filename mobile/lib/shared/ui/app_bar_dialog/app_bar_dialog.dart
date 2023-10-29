import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/ui/app_bar_dialog/app_bar_profile_info.dart';
import 'package:immich_mobile/shared/ui/app_bar_dialog/app_bar_server_info.dart';
import 'package:url_launcher/url_launcher.dart';

class ImmichAppBarDialog extends HookConsumerWidget {
  const ImmichAppBarDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    final theme = Theme.of(context);
    bool isDarkTheme = theme.brightness == Brightness.dark;
    bool isHorizontal = MediaQuery.of(context).size.width > 600;
    final horizontalPadding = isHorizontal ? 100.0 : 20.0;
    final user = ref.watch(currentUserProvider);

    useEffect(
      () {
        ref.read(backupProvider.notifier).updateServerInfo();
        return null;
      },
      [user],
    );

    buildTopRow() {
      return Row(
        children: [
          InkWell(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(
              Icons.close,
              size: 20,
            ),
          ),
          const Expanded(
            child: Align(
              alignment: Alignment.center,
              child: Text(
                'IMMICH',
                style: TextStyle(
                  fontFamily: 'SnowburstOne',
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      );
    }

    buildActionButton(IconData icon, String text, Function() onTap) {
      return ListTile(
        dense: true,
        visualDensity: VisualDensity.compact,
        contentPadding: const EdgeInsets.only(left: 30),
        minLeadingWidth: 50,
        leading: SizedBox(
          child: Icon(
            icon,
            color: theme.textTheme.labelMedium?.color,
            size: 20,
          ),
        ),
        title: Text(
          text,
          style:
              theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ).tr(),
        onTap: onTap,
      );
    }

    buildSettingButton() {
      return buildActionButton(
        Icons.settings_rounded,
        "profile_drawer_settings",
        () => AutoRouter.of(context).push(const SettingsRoute()),
      );
    }

    buildAppLogButton() {
      return buildActionButton(
        Icons.assignment_outlined,
        "profile_drawer_app_logs",
        () => AutoRouter.of(context).push(const AppLogRoute()),
      );
    }

    buildSignOutButton() {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10.0),
        child: Container(
          decoration: BoxDecoration(
            color: isDarkTheme
                ? Theme.of(context).scaffoldBackgroundColor
                : const Color.fromARGB(255, 225, 229, 240),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.only(left: 20),
            minLeadingWidth: 50,
            leading: SizedBox(
              child: Icon(
                Icons.logout_rounded,
                color: Theme.of(context).textTheme.labelMedium?.color,
                size: 20,
              ),
            ),
            title: Text(
              "profile_drawer_sign_out",
              style: Theme.of(context)
                  .textTheme
                  .labelLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ).tr(),
            onTap: () async {
              await ref.watch(authenticationProvider.notifier).logout();

              ref.read(manualUploadProvider.notifier).cancelBackup();
              ref.watch(backupProvider.notifier).cancelBackup();
              ref.watch(assetProvider.notifier).clearAllAsset();
              ref.watch(websocketProvider.notifier).disconnect();
              AutoRouter.of(context).replace(const LoginRoute());
            },
          ),
        ),
      );
    }

    Widget buildStorageInformation() {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 3),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isDarkTheme
                ? Theme.of(context).scaffoldBackgroundColor
                : const Color.fromARGB(255, 225, 229, 240),
          ),
          child: ListTile(
            minLeadingWidth: 50,
            leading: Icon(
              Icons.storage_rounded,
              color: theme.primaryColor,
            ),
            title: const Text(
              "backup_controller_page_server_storage",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ).tr(),
            isThreeLine: true,
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: LinearProgressIndicator(
                      minHeight: 5.0,
                      value: backupState.serverInfo.diskUsagePercentage / 100.0,
                      backgroundColor: Colors.grey,
                      color: theme.primaryColor,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 12.0),
                    child:
                        const Text('backup_controller_page_storage_format').tr(
                      args: [
                        backupState.serverInfo.diskUse,
                        backupState.serverInfo.diskSize,
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    buildFooter() {
      return Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
                launchUrl(
                  Uri.parse('https://documentation.immich.app'),
                );
              },
              child: Text(
                "profile_drawer_documentation",
                style: Theme.of(context).textTheme.bodySmall,
              ).tr(),
            ),
            const SizedBox(
              width: 20,
              child: Text(
                "•",
                textAlign: TextAlign.center,
              ),
            ),
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
                launchUrl(
                  Uri.parse('https://github.com/immich-app/immich'),
                );
              },
              child: Text(
                "profile_drawer_github",
                style: Theme.of(context).textTheme.bodySmall,
              ).tr(),
            ),
          ],
        ),
      );
    }

    return Dialog(
      clipBehavior: Clip.hardEdge,
      elevation: 1,
      alignment: Alignment.topCenter,
      insetPadding: EdgeInsets.only(
        top: isHorizontal ? 20 : 60,
        left: horizontalPadding,
        right: horizontalPadding,
        bottom: isHorizontal ? 20 : 100,
      ),
      backgroundColor: theme.cardColor,
      shape: RoundedRectangleBorder(
        side: const BorderSide(width: 1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: SizedBox(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: buildTopRow(),
              ),
              const AppBarProfileInfoBox(),
              buildSignOutButton(),
              buildStorageInformation(),
              const AppBarServerInfo(),
              buildAppLogButton(),
              buildSettingButton(),
              buildFooter(),
            ],
          ),
        ),
      ),
    );
  }
}
