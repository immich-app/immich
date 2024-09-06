import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';

class SharePartnerButton extends StatelessWidget {
  const SharePartnerButton({super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.pushRoute(const PartnerRoute()),
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: Icon(
        Icons.swap_horizontal_circle_rounded,
        size: 25,
        semanticLabel: 'partner_page_title'.tr(),
      ),
    );
  }
}
