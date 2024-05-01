import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/ui/user_avatar.dart';

class PartnerList extends HookConsumerWidget {
  const PartnerList({super.key, required this.partner});

  final List<User> partner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverList(
      delegate:
          SliverChildBuilderDelegate(listEntry, childCount: partner.length),
    );
  }

  Widget listEntry(BuildContext context, int index) {
    final User p = partner[index];
    return ListTile(
      contentPadding: const EdgeInsets.only(
        left: 12.0,
        right: 18.0,
      ),
      leading: userAvatar(context, p, radius: 24),
      title: Text(
        "partner_list_user_photos",
        style: context.textTheme.labelLarge,
      ).tr(
        namedArgs: {
          'user': p.name,
        },
      ),
      trailing: Text(
        "partner_list_view_all",
        style: context.textTheme.labelLarge?.copyWith(
          color: context.primaryColor,
        ),
      ).tr(),
      onTap: () => context.pushRoute((PartnerDetailRoute(partner: p))),
    );
  }
}
