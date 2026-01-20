import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_thumbnail_provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/activities/dismissible_activity.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class CommentBubble extends ConsumerWidget {
  final Activity activity;
  final bool isAssetActivity;

  const CommentBubble({super.key, required this.activity, this.isAssetActivity = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final isOwn = activity.user.id == user?.id;
    final canDelete = isOwn || album.ownerId == user?.id;
    final showThumbnail = !isAssetActivity && activity.assetId != null && activity.assetId!.isNotEmpty;
    final isLike = activity.type == ActivityType.like;
    final bgColor = isOwn ? context.colorScheme.primaryContainer : context.colorScheme.surfaceContainer;

    final activityNotifier = ref.read(
      albumActivityProvider(album.id, isAssetActivity ? activity.assetId : null).notifier,
    );

    Future<void> openAssetViewer() async {
      final activityService = ref.read(activityServiceProvider);
      final route = await activityService.buildAssetViewerRoute(activity.assetId!, ref);
      if (route != null) await context.pushRoute(route);
    }

    // avatar (hidden for own messages)
    Widget avatar = const SizedBox.shrink();
    if (!isOwn) {
      avatar = UserCircleAvatar(user: activity.user, size: 28, radius: 14);
    }

    // Thumbnail with tappable behavior and optional heart overlay
    Widget? thumbnail;
    if (showThumbnail) {
      thumbnail = ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 150, maxHeight: 150),
        child: Stack(
          children: [
            GestureDetector(
              onTap: openAssetViewer,
              child: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(10)),
                child: Image(
                  image: ImmichRemoteThumbnailProvider(assetId: activity.assetId!),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            if (isLike)
              Positioned(
                right: 6,
                bottom: 6,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: context.colorScheme.surfaceContainer, shape: BoxShape.circle),
                  child: Icon(Icons.thumb_up, color: context.primaryColor, size: 18),
                ),
              ),
          ],
        ),
      );
    }

    // Likes widget
    Widget? likes;
    if (isLike && !showThumbnail) {
      likes = Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: context.colorScheme.surfaceContainer, shape: BoxShape.circle),
        child: Icon(Icons.thumb_up, color: context.primaryColor, size: 18),
      );
    }

    // Comment bubble, comment-only
    Widget? commentBubble;
    if (activity.comment != null && activity.comment!.isNotEmpty) {
      commentBubble = ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.5),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: bgColor, borderRadius: const BorderRadius.all(Radius.circular(12))),
          child: Text(
            activity.comment ?? '',
            style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurface),
          ),
        ),
      );
    }

    // Combined content widgets
    final List<Widget> contentChildren = [thumbnail, likes, commentBubble].whereType<Widget>().toList();

    return DismissibleActivity(
      onDismiss: canDelete ? (id) async => await activityNotifier.removeActivity(id) : null,
      activity.id,
      Align(
        alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.86),
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isOwn) ...[avatar, const SizedBox(width: 8)],
                // Content column
                Column(
                  crossAxisAlignment: isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    ...contentChildren.map((w) => Padding(padding: const EdgeInsets.only(bottom: 8.0), child: w)),
                    Text(
                      '${activity.user.name} • ${activity.createdAt.timeAgo()}',
                      style: context.textTheme.labelMedium?.copyWith(
                        color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
                if (isOwn) const SizedBox(width: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
