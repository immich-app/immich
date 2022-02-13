import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';

class ProfileDrawer extends ConsumerWidget {
  const ProfileDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AuthenticationState _authState = ref.watch(authenticationProvider);

    return Drawer(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(5),
          bottomRight: Radius.circular(5),
        ),
      ),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.grey[200],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Image(
                  image: AssetImage('assets/immich-logo-no-outline.png'),
                  width: 50,
                  filterQuality: FilterQuality.high,
                ),
                const Padding(padding: EdgeInsets.all(8)),
                Text(
                  _authState.userEmail,
                  style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold),
                )
              ],
            ),
          ),
          ListTile(
            tileColor: Colors.grey[100],
            leading: const Icon(
              Icons.logout_rounded,
              color: Colors.black54,
            ),
            title: const Text(
              "Sign Out",
              style: TextStyle(color: Colors.black54, fontSize: 14),
            ),
            onTap: () async {
              bool res = await ref.read(authenticationProvider.notifier).logout();

              if (res) {
                ref.watch(backupProvider.notifier).cancelBackup();
                ref.watch(assetProvider.notifier).clearAllAsset();
                AutoRouter.of(context).popUntilRoot();
              }
            },
          )
        ],
      ),
    );
  }
}
