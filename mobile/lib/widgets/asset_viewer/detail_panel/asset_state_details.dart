import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/user.service.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class AssetStateInfo extends ConsumerWidget {
  final Asset asset;

  const AssetStateInfo({
    super.key,
    required this.asset,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    final userService = ref.watch(userServiceProvider);
    final User? user = (asset.ownerId == Store.get(StoreKey.currentUser).isarId)
        ? null
        : userService.lookupUserById(asset.ownerId);

    return ListTile(
      contentPadding: const EdgeInsets.all(0),
      dense: true,
      leading: (user == null)
          ? Icon(
              storageIcon(asset),
              color: textColor.withAlpha(200),
            )
          : UserCircleAvatar(
              user: user,
              radius: 12,
              size: 30,
            ).build(context),
      title: Text(
        (user == null) ? storageText(asset) : "storage_asset_partner".tr(),
        style: context.textTheme.labelLarge,
      ),
      subtitle: (user == null)
          ? null
          : Text(
              user.name,
              style: context.textTheme.bodySmall,
            ),
    );
  }
}
