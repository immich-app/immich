import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/drift_activity_text_field.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_thumbnail_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/activities/dismissible_activity.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class DriftActivitiesPage extends HookConsumerWidget {
  final RemoteAlbum album;

  const DriftActivitiesPage({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.read(currentAssetNotifier) as RemoteAsset?;

    final activityNotifier = ref.read(albumActivityProvider(album.id, asset?.id).notifier);
    final activities = ref.watch(albumActivityProvider(album.id, asset?.id));
    final listViewScrollController = useScrollController();

    void scrollToBottom() {
      listViewScrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.fastOutSlowIn);
    }

    Future<void> onAddComment(String comment) async {
      await activityNotifier.addComment(comment);
      scrollToBottom();
    }

    return ProviderScope(
      overrides: [currentRemoteAlbumScopedProvider.overrideWithValue(album)],
      child: Scaffold(
        appBar: AppBar(
          title: asset == null ? Text(album.name) : null,
          actions: [const LikeActivityActionButton(menuItem: true)],
          actionsPadding: const EdgeInsets.only(right: 8),
        ),
        body: activities.widgetWhen(
          onData: (data) {
            final List<Widget> activityWidgets = [];
            for (final activity in data.reversed) {
              activityWidgets.add(
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: _CommentBubble(activity: activity),
                ),
              );
            }

            return SafeArea(
              child: Stack(
                children: [
                  ListView(
                    controller: listViewScrollController,
                    padding: const EdgeInsets.only(top: 8, bottom: 80),
                    reverse: true,
                    children: activityWidgets,
                  ),
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Container(
                      decoration: BoxDecoration(
                        color: context.scaffoldBackgroundColor,
                        border: Border(top: BorderSide(color: context.colorScheme.secondaryContainer, width: 1)),
                      ),
                      child: DriftActivityTextField(isEnabled: album.isActivityEnabled, onSubmit: onAddComment),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        resizeToAvoidBottomInset: true,
      ),
    );
  }
}

class _CommentBubble extends ConsumerWidget {
  final Activity activity;

  const _CommentBubble({required this.activity});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final isOwn = activity.user.id == user?.id;
    final canDelete = isOwn || album.ownerId == user?.id;
    final hasAsset = activity.assetId != null && activity.assetId!.isNotEmpty;
    final isLike = activity.type == ActivityType.like;
    final bgColor = isOwn ? context.colorScheme.primaryContainer : context.colorScheme.surfaceContainer;

    final activityNotifier = ref.read(albumActivityProvider(album.id, activity.assetId).notifier);

    Future<void> openAssetViewer() async {
      final activityService = ref.read(activityServiceProvider);
      final route = await activityService.buildAssetViewerRoute(activity.assetId!, ref);
      if (route != null) await context.pushRoute(route);
    }

    Widget avatar() {
      if (isOwn) {
        return const SizedBox.shrink();
      }

      return UserCircleAvatar(user: activity.user, size: 28, radius: 14);
    }

    Widget? thumbnail() {
      if (!hasAsset) {
        return null;
      }

      return ConstrainedBox(
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
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), shape: BoxShape.circle),
                  child: Icon(Icons.favorite, color: Colors.red[600], size: 18),
                ),
              ),
          ],
        ),
      );
    }

    // Likes Album widget (for likes without asset)
    Widget? likesToAlbum() {
      if (!isLike || hasAsset) {
        return null;
      }

      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), shape: BoxShape.circle),
        child: Icon(Icons.favorite, color: Colors.red[600], size: 18),
      );
    }

    Widget? commentBubble() {
      if (activity.comment == null || activity.comment!.isEmpty) {
        return null;
      }

      return ConstrainedBox(
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
    final List<Widget> contentChildren = [thumbnail(), likesToAlbum(), commentBubble()].whereType<Widget>().toList();

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
                if (!isOwn) ...[avatar(), const SizedBox(width: 8)],
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
