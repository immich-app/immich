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
    _buildSignoutButton() {
      return ListTile(
        horizontalTitleGap: 0,
        leading: SizedBox(
          height: double.infinity,
          child: Icon(
            Icons.logout_rounded,
            color: Colors.grey[700],
            size: 20,
          ),
        ),
        title: Text(
          "profile_drawer_sign_out",
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        onTap: () async {
          bool res = await ref.watch(authenticationProvider.notifier).logout();

          if (res) {
            ref.watch(backupProvider.notifier).cancelBackup();
            ref.watch(assetProvider.notifier).clearAllAsset();
            ref.watch(websocketProvider.notifier).disconnect();
            AutoRouter.of(context).replace(const LoginRoute());
          }
        },
      );
    }

    _buildSettingButton() {
      return ListTile(
        horizontalTitleGap: 0,
        leading: SizedBox(
          height: double.infinity,
          child: Icon(
            Icons.settings_rounded,
            color: Colors.grey[700],
            size: 20,
          ),
        ),
        title: Text(
          "profile_drawer_settings",
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        onTap: () {
          AutoRouter.of(context).push(const SettingsRoute());
        },
      );
    }

    return Drawer(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ListView(
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            children: [
              const ProfileDrawerHeader(),
              _buildSettingButton(),
              _buildSignoutButton(),
            ],
          ),
          const ServerInfoBox()
        ],
      ),
    );
  }
}
