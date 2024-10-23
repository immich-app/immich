import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/presentation/components/common/user_avatar.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/states/current_user.state.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ImAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: false,
      title: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ImLogo(dimension: SizeConstants.xm),
          SizedGap.sw(),
          ImLogoText(fontSize: 20),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: SizeConstants.m),
          child: ImUserAvatar(
            user: di<CurrentUserProvider>().value,
            radius: SizeConstants.m,
          ),
        ),
      ],
      backgroundColor: context.theme.appBarTheme.backgroundColor,
      centerTitle: false,
    );
  }
}
