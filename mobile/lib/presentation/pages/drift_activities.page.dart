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

@RoutePage()
class DriftActivitiesPage extends HookConsumerWidget {
  const DriftActivitiesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;
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

          return SafeArea(
            child: Stack(
              children: [
                ListView.builder(
                  controller: listViewScrollController,
                  itemCount: data.length + 1,
                  itemBuilder: (context, index) {
                    if (index == data.length) {
                      return const SizedBox(height: 80);
                    }
                    final activity = data[index];
                    final canDelete = activity.user.id == user?.id || album.ownerId == user?.id;
                    return Padding(
                      padding: const EdgeInsets.all(5),
                      child: DismissibleActivity(
                        activity.id,
                        ActivityTile(activity),
                        onDismiss: canDelete
                            ? (activityId) async => await activityNotifier.removeActivity(activity.id)
                            : null,
                      ),
                    );
                  },
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
