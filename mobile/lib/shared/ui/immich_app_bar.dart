import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/app_bar_dialog/app_bar_dialog.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';

import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_info.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';

class ImmichAppBar extends ConsumerWidget implements PreferredSizeWidget {
  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
  final Widget? action;

  const ImmichAppBar({super.key, this.action});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final BackUpState backupState = ref.watch(backupProvider);
    final bool isEnableAutoBackup =
        backupState.backgroundBackup || backupState.autoBackup;
    final ServerInfo serverInfoState = ref.watch(serverInfoProvider);
    final user = Store.tryGet(StoreKey.currentUser);
    final isDarkTheme = context.isDarkTheme;
    const widgetSize = 30.0;

    buildProfileIndicator() {
      return InkWell(
        onTap: () => showDialog(
          context: context,
          useRootNavigator: false,
          builder: (ctx) => const ImmichAppBarDialog(),
        ),
        borderRadius: BorderRadius.circular(12),
        child: Badge(
          label: Container(
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(widgetSize / 2),
            ),
            child: const Icon(
              Icons.info,
              color: Color.fromARGB(255, 243, 188, 106),
              size: widgetSize / 2,
            ),
          ),
          backgroundColor: Colors.transparent,
          alignment: Alignment.bottomRight,
          isLabelVisible: serverInfoState.isVersionMismatch ||
              ((user?.isAdmin ?? false) &&
                  serverInfoState.isNewReleaseAvailable),
          offset: const Offset(2, 2),
          child: user == null
              ? const Icon(
                  Icons.face_outlined,
                  size: widgetSize,
                )
              : UserCircleAvatar(
                  radius: 15,
                  size: 27,
                  user: user,
                ),
        ),
      );
    }

    getBackupBadgeIcon() {
      final iconColor = isDarkTheme ? Colors.white : Colors.black;

      if (isEnableAutoBackup) {
        if (backupState.backupProgress == BackUpProgressEnum.inProgress) {
          return Container(
            padding: const EdgeInsets.all(3.5),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              strokeCap: StrokeCap.round,
              valueColor: AlwaysStoppedAnimation<Color>(iconColor),
            ),
          );
        } else if (backupState.backupProgress !=
                BackUpProgressEnum.inBackground &&
            backupState.backupProgress != BackUpProgressEnum.manualInProgress) {
          return Icon(
            Icons.check_outlined,
            size: 9,
            color: iconColor,
          );
        }
      }

      if (!isEnableAutoBackup) {
        return Icon(
          Icons.cloud_off_rounded,
          size: 9,
          color: iconColor,
        );
      }
    }

    buildBackupIndicator() {
      final indicatorIcon = getBackupBadgeIcon();
      final badgeBackground = isDarkTheme ? Colors.blueGrey[800] : Colors.white;

      return InkWell(
        onTap: () => context.autoPush(const BackupControllerRoute()),
        borderRadius: BorderRadius.circular(12),
        child: Badge(
          label: Container(
            width: widgetSize / 2,
            height: widgetSize / 2,
            decoration: BoxDecoration(
              color: badgeBackground,
              border: Border.all(
                color: isDarkTheme ? Colors.black : Colors.grey,
              ),
              borderRadius: BorderRadius.circular(widgetSize / 2),
            ),
            child: indicatorIcon,
          ),
          backgroundColor: Colors.transparent,
          alignment: Alignment.bottomRight,
          isLabelVisible: indicatorIcon != null,
          offset: const Offset(2, 2),
          child: Icon(
            Icons.backup_rounded,
            size: widgetSize,
            color: context.primaryColor,
          ),
        ),
      );
    }

    return AppBar(
      backgroundColor: context.themeData.appBarTheme.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(5),
        ),
      ),
      automaticallyImplyLeading: false,
      centerTitle: false,
      title: Builder(
        builder: (BuildContext context) {
          return Row(
            children: [
              Container(
                padding: const EdgeInsets.only(top: 3),
                width: 28,
                height: 28,
                child: Image.asset(
                  'assets/immich-logo.png',
                ),
              ),
              Container(
                margin: const EdgeInsets.only(left: 10),
                child: const Text(
                  'IMMICH',
                  style: TextStyle(
                    fontFamily: 'SnowburstOne',
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                  ),
                ),
              ),
            ],
          );
        },
      ),
      actions: [
        if (action != null)
          Padding(padding: const EdgeInsets.only(right: 20), child: action!),
        Padding(
          padding: const EdgeInsets.only(right: 20),
          child: buildBackupIndicator(),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 20),
          child: buildProfileIndicator(),
        ),
      ],
    );
  }
}
