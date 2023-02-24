import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';

import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/ui/transparent_image.dart';

class HomePageAppBar extends ConsumerWidget with PreferredSizeWidget {
  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  const HomePageAppBar({
    super.key,
    this.onPopBack,
  });

  final Function? onPopBack;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final BackUpState backupState = ref.watch(backupProvider);
    bool isEnableAutoBackup = backupState.backgroundBackup ||
        ref.watch(authenticationProvider).deviceInfo.isAutoBackup;
    final ServerInfoState serverInfoState = ref.watch(serverInfoProvider);
    AuthenticationState authState = ref.watch(authenticationProvider);

    buildProfilePhoto() {
      if (authState.profileImagePath.isEmpty) {
        return IconButton(
          splashRadius: 25,
          icon: const Icon(
            Icons.face_outlined,
            size: 30,
          ),
          onPressed: () {
            Scaffold.of(context).openDrawer();
          },
        );
      } else {
        String endpoint = Hive.box(userInfoBox).get(serverEndpointKey);
        var dummy = Random().nextInt(1024);
        return InkWell(
          onTap: () {
            Scaffold.of(context).openDrawer();
          },
          child: CircleAvatar(
            backgroundColor: Theme.of(context).primaryColor,
            radius: 18,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(50),
              child: FadeInImage.memoryNetwork(
                fit: BoxFit.cover,
                placeholder: kTransparentImage,
                width: 33,
                height: 33,
                image:
                    '$endpoint/user/profile-image/${authState.userId}?d=${dummy++}',
                fadeInDuration: const Duration(milliseconds: 200),
              ),
            ),
          ),
        );
      }
    }

    return AppBar(
      backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(5),
        ),
      ),
      leading: Builder(
        builder: (BuildContext context) {
          return Stack(
            children: [
              Center(
                child: buildProfilePhoto(),
              ),
              if (serverInfoState.isVersionMismatch)
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: GestureDetector(
                    onTap: () => Scaffold.of(context).openDrawer(),
                    child: Material(
                      // color: Colors.grey[200],
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50.0),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.all(2.0),
                        child: Icon(
                          Icons.info,
                          color: Color.fromARGB(255, 243, 188, 106),
                          size: 15,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      title: const Text(
        'IMMICH',
        style: TextStyle(
          fontFamily: 'SnowburstOne',
          fontWeight: FontWeight.bold,
          fontSize: 22,
        ),
      ),
      actions: [
        Stack(
          alignment: AlignmentDirectional.center,
          children: [
            if (backupState.backupProgress == BackUpProgressEnum.inProgress)
              Positioned(
                top: 10,
                right: 12,
                child: SizedBox(
                  height: 8,
                  width: 8,
                  child: CircularProgressIndicator(
                    strokeWidth: 1,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).primaryColor,
                    ),
                  ),
                ),
              ),
            IconButton(
              splashRadius: 25,
              iconSize: 30,
              icon: isEnableAutoBackup
                  ? const Icon(
                      Icons.backup_rounded,
                    )
                  : Badge(
                      padding: const EdgeInsets.all(4),
                      backgroundColor: Colors.white,
                      label: const Icon(
                        Icons.cloud_off_rounded,
                        size: 8,
                        color: Colors.indigo,
                      ),
                      child: Icon(
                        Icons.backup_rounded,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
              onPressed: () async {
                var onPop = await AutoRouter.of(context)
                    .push(const BackupControllerRoute());

                if (onPop != null && onPop == true) {
                  onPopBack!();
                }
              },
            ),
            if (backupState.backupProgress == BackUpProgressEnum.inProgress)
              Positioned(
                bottom: 5,
                child: Text(
                  '${backupState.allUniqueAssets.length - backupState.selectedAlbumsBackupAssetsIds.length}',
                  style:
                      const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
