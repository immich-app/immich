import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer/profile_drawer_header.dart';
import 'package:immich_mobile/modules/home/ui/profile_drawer/server_info_box.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';

class ProfileDrawer extends HookConsumerWidget {
  const ProfileDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Drawer(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ListView(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            children: [
              const ProfileDrawerHeader(),
              ListTile(
                tileColor: Colors.grey[100],
                leading: const Icon(
                  Icons.logout_rounded,
                  color: Colors.black54,
                ),
                title: const Text(
                  "profile_drawer_sign_out",
                  style: TextStyle(
                    color: Colors.black54,
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
                    // AutoRouter.of(context).popUntilRoot();
                    AutoRouter.of(context).replace(const LoginRoute());
                  }
                },
              )
            ],
          ),
          const ServerInfoBox()
        ],
      ),
    );
  }
}
