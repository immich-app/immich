import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/activities/comment_bubble.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/like_activity_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/drift_activity_text_field.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';

@RoutePage()
class DriftActivitiesPage extends HookConsumerWidget {
  final RemoteAlbum album;
  final String? assetId;
  final String? assetName;

  const DriftActivitiesPage({super.key, required this.album, this.assetId, this.assetName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityNotifier = ref.read(albumActivityProvider(album.id, assetId).notifier);
    final activities = ref.watch(albumActivityProvider(album.id, assetId));
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
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(album.name),
              if (assetName != null) Text(assetName!, style: context.textTheme.bodySmall),
            ],
          ),
          actions: [const LikeActivityActionButton(iconOnly: true)],
          actionsPadding: const EdgeInsets.only(right: 8),
        ),
        body: activities.widgetWhen(
          onData: (data) {
            final List<Widget> activityWidgets = [];
            for (final activity in data.reversed) {
              activityWidgets.add(
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: CommentBubble(activity: activity, isAssetActivity: assetId != null),
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
