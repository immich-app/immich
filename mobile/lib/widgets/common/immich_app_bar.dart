import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/immich_logo_provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_dialog.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

class ImmichAppBar extends ConsumerWidget implements PreferredSizeWidget {
  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
  final Widget? action;

  const ImmichAppBar({super.key, this.action});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ServerInfo serverInfoState = ref.watch(serverInfoProvider);
    final immichLogo = ref.watch(immichLogoProvider);
    final user = Store.tryGet(StoreKey.currentUser);
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
          child: IconButton.outlined(
            onPressed: () {
              context.pushRoute(const BackupRoute());
            },
            icon: const Icon(Icons.backup_rounded),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 20),
          child: buildProfileIndicator(),
        ),
      ],
    );
  }
}
