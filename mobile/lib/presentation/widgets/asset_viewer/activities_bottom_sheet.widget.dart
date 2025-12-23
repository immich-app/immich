import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/activities/comment_bubble.dart';
import 'package:immich_mobile/presentation/widgets/album/drift_activity_text_field.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';

class ActivitiesBottomSheet extends HookConsumerWidget {
  final DraggableScrollableController controller;
  final double initialChildSize;
  final bool scrollToBottomInitially;

  const ActivitiesBottomSheet({
    required this.controller,
    this.initialChildSize = 0.35,
    this.scrollToBottomInitially = true,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;

    final activityNotifier = ref.read(albumActivityProvider(album.id, asset?.id).notifier);
    final activities = ref.watch(albumActivityProvider(album.id, asset?.id));

    Future<void> onAddComment(String comment) async {
      await activityNotifier.addComment(comment);
    }

    Widget buildActivitiesSliver() {
      return activities.widgetWhen(
        onLoading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
        onData: (data) {
          return SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              if (index == data.length) {
                return const SizedBox.shrink();
              }
              final activity = data[data.length - 1 - index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: CommentBubble(activity: activity, isAssetActivity: true),
              );
            }, childCount: data.length + 1),
          );
        },
      );
    }

    return BaseBottomSheet(
      actions: [],
      slivers: [buildActivitiesSliver()],
      footer: Padding(
        // TODO: avoid fixed padding, use context.padding.bottom
        padding: const EdgeInsets.only(bottom: 32),
        child: Column(
          children: [
            const Divider(indent: 16, endIndent: 16),
            DriftActivityTextField(
              isEnabled: album.isActivityEnabled,
              isBottomSheet: true,
              // likeId: likedId,
              onSubmit: onAddComment,
            ),
          ],
        ),
      ),
      controller: controller,
      initialChildSize: initialChildSize,
      minChildSize: 0.1,
      maxChildSize: 0.88,
      expand: false,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      backgroundColor: context.isDarkTheme ? context.colorScheme.surface : Colors.white,
    );
  }
}
