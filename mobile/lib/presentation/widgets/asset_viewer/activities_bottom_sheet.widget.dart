import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/activities/comment_bubble.dart';
import 'package:immich_mobile/presentation/widgets/album/drift_activity_text_field.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

class ActivitiesBottomSheet extends HookConsumerWidget {
  final DraggableScrollableController controller;
  final double initialChildSize;
  final bool scrollToBottomInitially;
  final String? activityId;

  const ActivitiesBottomSheet({
    required this.controller,
    this.initialChildSize = 0.35,
    this.scrollToBottomInitially = true,
    this.activityId,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;

    final activityNotifier = ref.read(albumActivityProvider(album.id, asset?.id).notifier);
    final activities = ref.watch(albumActivityProvider(album.id, asset?.id));

    // ItemScrollControllerを作成
    final itemScrollController = useMemoized(() => ItemScrollController(), []);
    final itemPositionsListener = useMemoized(() => ItemPositionsListener.create(), []);

    // activityIdが指定されている場合、スクロール処理
    useEffect(() {
      if (activityId == null) {
        return null;
      }

      if (!activities.hasValue) {
        return null;
      }

      final data = activities.value!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final activityIndex = data.indexWhere((activity) => activity.id == activityId);
        if (activityIndex != -1) {
          // 逆順表示のため、実際の表示インデックスを計算
          final displayIndex = data.length - 1 - activityIndex;
          itemScrollController.scrollTo(
            index: displayIndex,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            alignment: 0.1, // 上部から少し下に配置
          );
        }
      });
      return null;
    }, [activityId, activities, itemScrollController]);

    Future<void> onAddComment(String comment) async {
      await activityNotifier.addComment(comment);
    }

    final activitiesWidget = activities.widgetWhen(
      onLoading: () => const Center(child: CircularProgressIndicator()),
      onData: (data) {
        return ScrollablePositionedList.builder(
          itemScrollController: itemScrollController,
          itemPositionsListener: itemPositionsListener,
          itemCount: data.length,
          itemBuilder: (context, index) {
            // 逆順表示のため、インデックスを反転
            final activity = data[data.length - 1 - index];
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: CommentBubble(activity: activity, isAssetActivity: true),
            );
          },
        );
      },
    );

    return BaseBottomSheet(
      controller: controller,
      footer: Padding(
        padding: const EdgeInsets.only(bottom: 32),
        child: Column(
          children: [
            const Divider(indent: 16, endIndent: 16),
            DriftActivityTextField(isEnabled: album.isActivityEnabled, isBottomSheet: true, onSubmit: onAddComment),
          ],
        ),
      ),
      initialChildSize: initialChildSize,
      minChildSize: 0.1,
      maxChildSize: 0.88,
      expand: false,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
      child: activitiesWidget,
    );
  }
}
