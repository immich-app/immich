import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/image/immich_remote_thumbnail_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class ActivityTile extends HookConsumerWidget {
  final Activity activity;

  const ActivityTile(this.activity, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetProvider);
    final isLike = activity.type == ActivityType.like;
    // Asset thumbnail is displayed when we are accessing activities from the album page
    // currentAssetProvider will not be set until we open the gallery viewer
    final showAssetThumbnail = asset == null && activity.assetId != null;

    return ListTile(
      minVerticalPadding: 15,
      leading: isLike
          ? Container(
              width: 44,
              alignment: Alignment.center,
              child: Icon(
                Icons.favorite_rounded,
                color: Colors.red[700],
              ),
            )
          : UserCircleAvatar(user: activity.user),
      title: _ActivityTitle(
        userName: activity.user.name,
        createdAt: activity.createdAt.timeAgo(),
        leftAlign: isLike || showAssetThumbnail,
      ),
      // No subtitle for like, so center title
      titleAlignment:
          !isLike ? ListTileTitleAlignment.top : ListTileTitleAlignment.center,
      trailing: showAssetThumbnail
          ? _ActivityAssetThumbnail(activity.assetId!)
          : null,
      subtitle: !isLike ? Text(activity.comment!) : null,
    );
  }
}

class _ActivityTitle extends StatelessWidget {
  final String userName;
  final String createdAt;
  final bool leftAlign;

  const _ActivityTitle({
    required this.userName,
    required this.createdAt,
    required this.leftAlign,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    final textStyle = context.textTheme.bodyMedium
        ?.copyWith(color: textColor.withOpacity(0.6));

    return Row(
      mainAxisAlignment:
          leftAlign ? MainAxisAlignment.start : MainAxisAlignment.spaceBetween,
      mainAxisSize: leftAlign ? MainAxisSize.min : MainAxisSize.max,
      children: [
        Text(
          userName,
          style: textStyle,
          overflow: TextOverflow.ellipsis,
        ),
        if (leftAlign)
          Text(
            " • ",
            style: textStyle,
          ),
        Expanded(
          child: Text(
            createdAt,
            style: textStyle,
            overflow: TextOverflow.ellipsis,
            textAlign: leftAlign ? TextAlign.left : TextAlign.right,
          ),
        ),
      ],
    );
  }
}

class _ActivityAssetThumbnail extends StatelessWidget {
  final String assetId;

  const _ActivityAssetThumbnail(this.assetId);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 30,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(4)),
        image: DecorationImage(
          image: ImmichRemoteThumbnailProvider(
            assetId: assetId,
          ),
          fit: BoxFit.cover,
        ),
      ),
      child: const SizedBox.shrink(),
    );
  }
}
