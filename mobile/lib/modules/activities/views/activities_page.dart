import 'package:cached_network_image/cached_network_image.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/activities/models/activity.model.dart';
import 'package:immich_mobile/modules/activities/providers/activity.provider.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';
import 'package:immich_mobile/utils/datetime_extensions.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class ActivitiesPage extends HookConsumerWidget {
  final String albumId;
  final String? assetId;
  final bool withAssetThumbs;
  final String appBarTitle;
  final bool isOwner;
  const ActivitiesPage(
    this.albumId, {
    this.appBarTitle = "",
    this.assetId,
    this.withAssetThumbs = true,
    this.isOwner = false,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider =
        activityStateProvider((albumId: albumId, assetId: assetId));
    final activities = ref.watch(provider);
    final inputController = useTextEditingController();
    final inputFocusNode = useFocusNode();
    final listViewScrollController = useScrollController();
    final currentUser = Store.tryGet(StoreKey.currentUser);

    useEffect(
      () {
        inputFocusNode.requestFocus();
        return null;
      },
      [],
    );
    buildTitleWithTimestamp(Activity activity, {bool leftAlign = true}) {
      final textColor = Theme.of(context).brightness == Brightness.dark
          ? Colors.white
          : Colors.black;
      final textStyle = Theme.of(context)
          .textTheme
          .bodyMedium
          ?.copyWith(color: textColor.withOpacity(0.6));

      return Row(
        mainAxisAlignment: leftAlign
            ? MainAxisAlignment.start
            : MainAxisAlignment.spaceBetween,
        mainAxisSize: leftAlign ? MainAxisSize.min : MainAxisSize.max,
        children: [
          Text(
            "${activity.user.firstName} ${activity.user.lastName}",
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
              activity.createdAt.copyWith().timeAgo(),
              style: textStyle,
              overflow: TextOverflow.ellipsis,
              textAlign: leftAlign ? TextAlign.left : TextAlign.right,
            ),
          ),
        ],
      );
    }

    buildAssetThumbnail(Activity activity) {
      return withAssetThumbs && activity.assetId != null
          ? Container(
              width: 40,
              height: 30,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                image: DecorationImage(
                  image: CachedNetworkImageProvider(
                    getThumbnailUrlForRemoteId(
                      activity.assetId!,
                    ),
                    cacheKey: getThumbnailCacheKeyForRemoteId(
                      activity.assetId!,
                    ),
                    headers: {
                      "Authorization":
                          'Bearer ${Store.get(StoreKey.accessToken)}',
                    },
                  ),
                  fit: BoxFit.cover,
                ),
              ),
              child: const SizedBox.shrink(),
            )
          : null;
    }

    buildTextField(String? likedId) {
      final liked = likedId != null;
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: inputController,
          focusNode: inputFocusNode,
          textInputAction: TextInputAction.send,
          autofocus: false,
          decoration: InputDecoration(
            border: InputBorder.none,
            focusedBorder: InputBorder.none,
            prefixIcon: currentUser != null
                ? Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: UserCircleAvatar(
                      user: currentUser,
                      size: 30,
                      radius: 15,
                    ),
                  )
                : null,
            suffixIcon: Padding(
              padding: const EdgeInsets.only(right: 10),
              child: IconButton(
                icon: Icon(
                  liked
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                ),
                onPressed: () async {
                  liked
                      ? await ref
                          .read(provider.notifier)
                          .removeActivity(likedId)
                      : await ref.read(provider.notifier).addLike();
                },
              ),
            ),
            suffixIconColor: liked ? Colors.red[700] : null,
            hintText: 'shared_album_activities_input_hint'.tr(),
            hintStyle: TextStyle(
              fontWeight: FontWeight.normal,
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          onEditingComplete: () async {
            await ref.read(provider.notifier).addComment(inputController.text);
            inputController.clear();
            inputFocusNode.unfocus();
            listViewScrollController.animateTo(
              listViewScrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 800),
              curve: Curves.fastOutSlowIn,
            );
          },
          onTapOutside: (_) => inputFocusNode.unfocus(),
        ),
      );
    }

    getDismissibleWidget(
      Widget widget,
      Activity activity,
      bool canDelete,
    ) {
      return Dismissible(
        key: Key(activity.id),
        dismissThresholds: const {
          DismissDirection.horizontal: 0.7,
        },
        direction: DismissDirection.horizontal,
        confirmDismiss: (direction) => canDelete
            ? showDialog(
                context: context,
                builder: (context) => ConfirmDialog(
                  onOk: () {},
                  title: "shared_album_activity_remove_title",
                  content: "shared_album_activity_remove_content",
                  ok: "delete_dialog_ok",
                ),
              )
            : Future.value(false),
        onDismissed: (direction) async =>
            await ref.read(provider.notifier).removeActivity(activity.id),
        background: Container(
          color: canDelete ? Colors.red[400] : Colors.grey[600],
          alignment: AlignmentDirectional.centerStart,
          child: canDelete
              ? const Padding(
                  padding: EdgeInsets.all(15),
                  child: Icon(
                    Icons.delete_sweep_rounded,
                    color: Colors.black,
                  ),
                )
              : null,
        ),
        secondaryBackground: Container(
          color: canDelete ? Colors.red[400] : Colors.grey[600],
          alignment: AlignmentDirectional.centerEnd,
          child: canDelete
              ? const Padding(
                  padding: EdgeInsets.all(15),
                  child: Icon(
                    Icons.delete_sweep_rounded,
                    color: Colors.black,
                  ),
                )
              : null,
        ),
        child: widget,
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(appBarTitle)),
      body: activities.maybeWhen(
        orElse: () {
          return const Center(child: ImmichLoadingIndicator());
        },
        data: (data) {
          final liked = data.firstWhereOrNull(
            (a) =>
                a.type == ActivityType.like &&
                a.user.id == currentUser?.id &&
                a.assetId == assetId,
          );

          return Stack(
            children: [
              ListView.builder(
                controller: listViewScrollController,
                itemCount: data.length + 1,
                itemBuilder: (context, index) {
                  // Vertical gap after the last element
                  if (index == data.length) {
                    return const SizedBox(
                      height: 80,
                    );
                  }

                  final activity = data[index];
                  final canDelete =
                      activity.user.id == currentUser?.id || isOwner;

                  return Padding(
                    padding: const EdgeInsets.all(5),
                    child: activity.type == ActivityType.comment
                        ? getDismissibleWidget(
                            ListTile(
                              minVerticalPadding: 15,
                              leading: UserCircleAvatar(user: activity.user),
                              title: buildTitleWithTimestamp(
                                activity,
                                leftAlign:
                                    withAssetThumbs && activity.assetId != null,
                              ),
                              titleAlignment: ListTileTitleAlignment.top,
                              trailing: buildAssetThumbnail(activity),
                              subtitle: Text(activity.comment!),
                            ),
                            activity,
                            canDelete,
                          )
                        : getDismissibleWidget(
                            ListTile(
                              minVerticalPadding: 15,
                              leading: Container(
                                width: 44,
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.favorite_rounded,
                                  color: Colors.red[700],
                                ),
                              ),
                              title: buildTitleWithTimestamp(activity),
                              trailing: buildAssetThumbnail(activity),
                            ),
                            activity,
                            canDelete,
                          ),
                  );
                },
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  child: buildTextField(liked?.id),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
