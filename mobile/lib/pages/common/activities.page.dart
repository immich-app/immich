import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/activities/activity_text_field.dart';
import 'package:immich_mobile/widgets/activities/activity_tile.dart';
import 'package:immich_mobile/widgets/activities/dismissible_activity.dart';

@RoutePage()
class ActivitiesPage extends HookConsumerWidget {
  const ActivitiesPage({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Album has to be set in the provider before reaching this page
    final album = ref.watch(currentAlbumProvider)!;
    final asset = ref.watch(currentAssetProvider);
    final user = ref.watch(currentUserProvider);

    final activityNotifier = ref
        .read(albumActivityProvider(album.remoteId!, asset?.remoteId).notifier);
    final activities =
        ref.watch(albumActivityProvider(album.remoteId!, asset?.remoteId));

    final listViewScrollController = useScrollController();

    Future<void> onAddComment(String comment) async {
      await activityNotifier.addComment(comment);
      // Scroll to the end of the list to show the newly added activity
      listViewScrollController.animateTo(
        listViewScrollController.position.maxScrollExtent + 200,
        duration: const Duration(milliseconds: 600),
        curve: Curves.fastOutSlowIn,
      );
    }

    return Scaffold(
      appBar: AppBar(title: asset == null ? Text(album.name) : null),
      body: activities.widgetWhen(
        onData: (data) {
          final liked = data.firstWhereOrNull(
            (a) =>
                a.type == ActivityType.like &&
                a.user.id == user?.id &&
                a.assetId == asset?.remoteId,
          );

          return SafeArea(
            child: Stack(
              children: [
                ListView.builder(
                  controller: listViewScrollController,
                  // +1 to display an additional over-scroll space after the last element
                  itemCount: data.length + 1,
                  itemBuilder: (context, index) {
                    // Additional vertical gap after the last element
                    if (index == data.length) {
                      return const SizedBox(
                        height: 80,
                      );
                    }

                    final activity = data[index];
                    final canDelete = activity.user.id == user?.id ||
                        album.ownerId == user?.uid;

                    return Padding(
                      padding: const EdgeInsets.all(5),
                      child: DismissibleActivity(
                        activity.id,
                        ActivityTile(activity),
                        onDismiss: canDelete
                            ? (activityId) async => await activityNotifier
                                .removeActivity(activity.id)
                            : null,
                      ),
                    );
                  },
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    color: context.scaffoldBackgroundColor,
                    child: ActivityTextField(
                      isEnabled: album.activityEnabled,
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
    );
  }
}
