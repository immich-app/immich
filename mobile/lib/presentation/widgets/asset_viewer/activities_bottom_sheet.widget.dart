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

class ActivitiesBottomSheetContent extends HookConsumerWidget {
  const ActivitiesBottomSheetContent({super.key});

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

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Expanded(child: CustomScrollView(slivers: [buildActivitiesSliver()])),
        Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 16),
          child: Column(
            children: [
              const Divider(indent: 16, endIndent: 16),
              DriftActivityTextField(isEnabled: album.isActivityEnabled, isBottomSheet: true, onSubmit: onAddComment),
            ],
          ),
        ),
      ],
    );
  }
}
