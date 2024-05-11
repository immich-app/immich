import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/immich_logo_provider.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_dialog.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

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
    final immichLogo = ref.watch(immichLogoProvider);
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
              semanticsLabel: 'backup_controller_page_backup'.tr(),
            ),
          );
        } else if (backupState.backupProgress !=
                BackUpProgressEnum.inBackground &&
            backupState.backupProgress != BackUpProgressEnum.manualInProgress) {
          return Icon(
            Icons.check_outlined,
            size: 9,
            color: iconColor,
            semanticLabel: 'backup_controller_page_backup'.tr(),
          );
        }
      }

      if (!isEnableAutoBackup) {
        return Icon(
          Icons.cloud_off_rounded,
          size: 9,
          color: iconColor,
          semanticLabel: 'backup_controller_page_backup'.tr(),
        );
      }
    }

    buildBackupIndicator() {
      final indicatorIcon = getBackupBadgeIcon();
      final badgeBackground = isDarkTheme ? Colors.blueGrey[800] : Colors.white;

      return InkWell(
        onTap: () => context.pushRoute(const BackupControllerRoute()),
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
              Builder(
                builder: (context) {
                  final today = DateTime.now();
                  if (today.month == 4 && today.day == 1) {
                    if (immichLogo.value == null) {
                      return const SizedBox.shrink();
                    }
                    return Image.memory(
                      immichLogo.value!,
                      fit: BoxFit.cover,
                      height: 80,
                    );
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 3.0),
                    child: SvgPicture.asset(
                      context.isDarkTheme
                          ? 'assets/immich-logo-inline-dark.svg'
                          : 'assets/immich-logo-inline-light.svg',
                      height: 40,
                    ),
                  );
                },
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
