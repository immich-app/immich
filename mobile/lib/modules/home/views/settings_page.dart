import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';

class SettingsPage extends HookConsumerWidget {
  const SettingsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: const Text(
          "settings_page",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        leading: GestureDetector(
          child: const Icon(
            Icons.arrow_back_ios,
          ),
          onTap: () {
            AutoRouter.of(context).pop();
          },
        ),
      ),
      body: Column(
        children: [
          ListTile(
            leading: Icon(
              Icons.dark_mode_rounded,
              color: Theme.of(context).primaryColor,
            ),
            title: const Text(
              "settings_page_apperance",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
            onTap: () {
              AutoRouter.of(context).push(const AppearanceRoute());
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(
              Icons.logout_rounded,
              color: Colors.red,
            ),
            title: const Text(
              "profile_drawer_sign_out",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
            onTap: () async {
              bool res =
                  await ref.watch(authenticationProvider.notifier).logout();

              if (res) {
                ref.watch(backupProvider.notifier).cancelBackup();
                ref.watch(assetProvider.notifier).clearAllAsset();
                ref.watch(websocketProvider.notifier).disconnect();
                AutoRouter.of(context).replace(const LoginRoute());
              }
            },
          ),
        ],
      ),
    );
  }
}
