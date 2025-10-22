import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/drift_activity_text_field.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/activities/activity_tile.dart';
import 'package:immich_mobile/widgets/activities/dismissible_activity.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/providers/image/immich_remote_thumbnail_provider.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';

@RoutePage()
class DriftActivitiesPage extends HookConsumerWidget {
  const DriftActivitiesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final asset = ref.read(currentAssetNotifier) as RemoteAsset?;
    final user = ref.watch(currentUserProvider);

    final activityNotifier = ref.read(albumActivityProvider(album.id, asset?.id).notifier);
    final activities = ref.watch(albumActivityProvider(album.id, asset?.id));
    final listViewScrollController = useScrollController();

    void scrollToBottom() {
      listViewScrollController.animateTo(
        listViewScrollController.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 600),
        curve: Curves.fastOutSlowIn,
      );
    }

    Future<void> onAddComment(String comment) async {
      await activityNotifier.addComment(comment);
      scrollToBottom();
    }

    return Scaffold(
      appBar: AppBar(
        title: asset == null ? Text(album.name) : null,
        actions: [const LikeActivityActionButton(menuItem: true)],
        actionsPadding: const EdgeInsets.only(right: 8),
      ),
      body: activities.widgetWhen(
        onData: (data) {
          final liked = data.firstWhereOrNull(
            (a) => a.type == ActivityType.like && a.user.id == user?.id && a.assetId == asset?.id,
          );

          // チャット風レイアウト: 日付セパレータを削除し、ActivityTile をバブルに置換（コメント＋画像は引用風）
          final List<Widget> activityWidgets = [];

          for (final activity in data) {
            final isOwn = activity.user.id == user?.id;
            final canDelete = isOwn || album.ownerId == user?.id;

            // Like: 自分の like はコメントと同じ青背景バブルで日時表示、他人の like は他人の comment と同形式にする
            if (activity.type == ActivityType.like) {
              final bubble = Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: _CommentBubble(
                  activity: activity,
                  isOwn: isOwn,
                  showAssetImage: true,
                  showHeart: true,
                  onDelete: canDelete ? () async => await activityNotifier.removeActivity(activity.id) : null,
                ),
              );

              if (canDelete) {
                activityWidgets.add(
                  Dismissible(
                    key: Key(activity.id),
                    dismissThresholds: const {DismissDirection.horizontal: 0.7},
                    direction: DismissDirection.horizontal,
                    confirmDismiss: (direction) => showDialog(
                      context: context,
                      builder: (context) => ConfirmDialog(
                        onOk: () {},
                        title: "shared_album_activity_remove_title",
                        content: "shared_album_activity_remove_content",
                        ok: "delete",
                      ),
                    ),
                    onDismissed: (_) async => await activityNotifier.removeActivity(activity.id),
                    background: Container(
                      alignment: AlignmentDirectional.centerStart,
                      color: Colors.red[400],
                      child: const Padding(
                        padding: EdgeInsets.all(15),
                        child: Icon(Icons.delete_sweep_rounded, color: Colors.black),
                      ),
                    ),
                    secondaryBackground: Container(
                      alignment: AlignmentDirectional.centerEnd,
                      color: Colors.red[400],
                      child: const Padding(
                        padding: EdgeInsets.all(15),
                        child: Icon(Icons.delete_sweep_rounded, color: Colors.black),
                      ),
                    ),
                    child: bubble,
                  ),
                );
              } else {
                activityWidgets.add(bubble);
              }

              continue;
            }

            // コメント（テキストまたは画像付き）はバブルで表示。ActivityTile は使わない
            if (activity.comment != null && activity.comment!.isNotEmpty) {
              // 画像がある場合は引用風: 画像のみを右寄せに表示する場合は isOwn で左右揃え
              final bubble = Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: _CommentBubble(
                  activity: activity,
                  isOwn: isOwn,
                  showAssetImage: activity.assetId != null,
                  onDelete: canDelete ? () async => await activityNotifier.removeActivity(activity.id) : null,
                ),
              );

              if (canDelete) {
                activityWidgets.add(
                  Dismissible(
                    key: Key(activity.id),
                    dismissThresholds: const {DismissDirection.horizontal: 0.7},
                    direction: DismissDirection.horizontal,
                    confirmDismiss: (direction) => showDialog(
                      context: context,
                      builder: (context) => ConfirmDialog(
                        onOk: () {},
                        title: "shared_album_activity_remove_title",
                        content: "shared_album_activity_remove_content",
                        ok: "delete",
                      ),
                    ),
                    onDismissed: (_) async => await activityNotifier.removeActivity(activity.id),
                    background: Container(
                      alignment: AlignmentDirectional.centerStart,
                      color: Colors.red[400],
                      child: const Padding(
                        padding: EdgeInsets.all(15),
                        child: Icon(Icons.delete_sweep_rounded, color: Colors.black),
                      ),
                    ),
                    secondaryBackground: Container(
                      alignment: AlignmentDirectional.centerEnd,
                      color: Colors.red[400],
                      child: const Padding(
                        padding: EdgeInsets.all(15),
                        child: Icon(Icons.delete_sweep_rounded, color: Colors.black),
                      ),
                    ),
                    child: bubble,
                  ),
                );
              } else {
                activityWidgets.add(bubble);
              }
              continue;
            }

            // その他（例: plain like without asset or system messages） - フォールバックで既存タイル表示
            activityWidgets.add(
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                child: DismissibleActivity(
                  activity.id,
                  ActivityTile(activity),
                  onDismiss: canDelete
                      ? (activityId) async => await activityNotifier.removeActivity(activity.id)
                      : null,
                ),
              ),
            );
          }

          // 下部余白確保
          activityWidgets.add(const SizedBox(height: 80));

          return SafeArea(
            child: Stack(
              children: [
                ListView(
                  controller: listViewScrollController,
                  padding: const EdgeInsets.only(top: 8, bottom: 0),
                  children: activityWidgets,
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    decoration: BoxDecoration(
                      color: context.scaffoldBackgroundColor,
                      border: Border(top: BorderSide(color: context.colorScheme.secondaryContainer, width: 1)),
                    ),
                    child: DriftActivityTextField(
                      isEnabled: album.isActivityEnabled,
                      likeId: liked?.id,
                      onSubmit: onAddComment,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      resizeToAvoidBottomInset: true,
    );
  }
}

// 日付フォーマット関数は現時点では不要

// _QuotedImage は使用しなくなったため削除。

class _CommentBubble extends ConsumerWidget {
  final Activity activity;
  final bool isOwn;
  final bool showAssetImage;
  final bool showHeart;
  final VoidCallback? onDelete;

  const _CommentBubble({
    required this.activity,
    required this.isOwn,
    required this.showAssetImage,
    this.showHeart = false,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bg = isOwn ? context.colorScheme.primaryContainer : context.colorScheme.surfaceContainer;
    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.86),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
          padding: const EdgeInsets.all(12),
          // decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
          child: Column(
            crossAxisAlignment: isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              // 名前やアイコンは不要（仕様）
              if (showAssetImage && activity.assetId != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!isOwn) ...[
                        UserCircleAvatar(user: activity.user, size: 28, radius: 14),
                        const SizedBox(width: 8),
                      ],
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 150, maxHeight: 150),
                        child: Stack(
                          children: [
                            // Make thumbnail tappable to open asset viewer
                            GestureDetector(
                              onTap: () async {
                                final activityService = ref.read(activityServiceProvider);
                                if (activity.assetId == null) return;
                                final route = await activityService.buildAssetViewerRoute(activity.assetId!, ref);
                                if (route != null) {
                                  await context.pushRoute(route);
                                }
                              },
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image(
                                  image: ImmichRemoteThumbnailProvider(assetId: activity.assetId!),
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                            if (showHeart)
                              Positioned(
                                right: 6,
                                bottom: 6,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.9),
                                    shape: BoxShape.circle,
                                  ),
                                  padding: const EdgeInsets.all(4),
                                  child: Icon(Icons.favorite, color: Colors.red[600], size: 18),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              // asset がない like の場合はバブル内にハートを表示
              if (showHeart && (activity.assetId == null || activity.assetId!.isEmpty))
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!isOwn) ...[
                        UserCircleAvatar(user: activity.user, size: 28, radius: 14),
                        const SizedBox(width: 8),
                      ],
                      // For own like-only, push to right by wrapping with Align when parent is right-aligned.
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), shape: BoxShape.circle),
                        child: Icon(Icons.favorite, color: Colors.red[600], size: 18),
                      ),
                    ],
                  ),
                ),
              // コメント本文: コメントが存在する場合のみ表示（showAssetImage の有無でレイアウトを切替）
              if (activity.comment != null && activity.comment!.isNotEmpty) ...[
                if (!showAssetImage) ...[
                  // コメントのみの表示: 自分の投稿は右寄せかつ本文幅に最小化、他人の投稿はアイコン表示とともに最小化
                  Row(
                    crossAxisAlignment: isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      if (!isOwn) ...[
                        UserCircleAvatar(user: activity.user, size: 28, radius: 14),
                        const SizedBox(width: 8),
                      ],
                      // For both own and non-own comment-only: minimize width to content, up to 50% of screen width.
                      Expanded(
                        child: Align(
                          alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.5),
                            child: IntrinsicWidth(
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
                                child: Text(
                                  activity.comment ?? '',
                                  style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurface),
                                  softWrap: true,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
                    child: Text(
                      activity.comment ?? '',
                      style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurface),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
              ],
              Text(
                // ユーザー名・日付と時間を表示
                '${activity.user.name} ・ ${activity.createdAt.year}/${activity.createdAt.month.toString().padLeft(2, '0')}/${activity.createdAt.day.toString().padLeft(2, '0')} '
                '${activity.createdAt.toLocal().toString().substring(11, 16)}',
                style: context.textTheme.labelSmall?.copyWith(
                  color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
