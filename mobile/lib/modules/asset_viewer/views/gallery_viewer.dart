import 'dart:io';
import 'dart:math';
import 'package:easy_localization/easy_localization.dart';
import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/providers/current_album.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/asset_stack.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/current_asset.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_controls_provider.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_value_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/services/asset_stack.service.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/advanced_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/home/ui/upload_dialog.dart';
import 'package:immich_mobile/modules/partner/providers/partner.provider.dart';
import 'package:immich_mobile/shared/cache/original_image_provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/modules/home/ui/delete_dialog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/photo_view/photo_view_gallery.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_computed_scale.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_scale_state.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/utils/photo_view_hero_attributes.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart' show ThumbnailFormat;

@RoutePage()
// ignore: must_be_immutable
class GalleryViewerPage extends HookConsumerWidget {
  final Asset Function(int index) loadAsset;
  final int totalAssets;
  final int initialIndex;
  final int heroOffset;
  final bool showStack;

  GalleryViewerPage({
    super.key,
    required this.initialIndex,
    required this.loadAsset,
    required this.totalAssets,
    this.heroOffset = 0,
    this.showStack = false,
  }) : controller = PageController(initialPage: initialIndex);

  final PageController controller;

  static const jpeg = ThumbnailFormat.JPEG;
  static const webp = ThumbnailFormat.WEBP;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsServiceProvider);
    final isLoadPreview = useState(AppSettingsEnum.loadPreview.defaultValue);
    final isLoadOriginal = useState(AppSettingsEnum.loadOriginal.defaultValue);
    final isZoomed = useState<bool>(false);
    final isPlayingMotionVideo = useState(false);
    final isPlayingVideo = useState(false);
    Offset? localPosition;
    final header = {"x-immich-user-token": Store.get(StoreKey.accessToken)};
    final currentIndex = useState(initialIndex);
    final currentAsset = loadAsset(currentIndex.value);
    final isTrashEnabled =
        ref.watch(serverInfoProvider.select((v) => v.serverFeatures.trash));
    final navStack = AutoRouter.of(context).stackData;
    final isFromTrash = isTrashEnabled &&
        navStack.length > 2 &&
        navStack.elementAt(navStack.length - 2).name == TrashRoute.name;
    final stackIndex = useState(-1);
    final stack = showStack && currentAsset.stackChildrenCount > 0
        ? ref.watch(assetStackStateProvider(currentAsset))
        : <Asset>[];
    final stackElements = showStack ? [currentAsset, ...stack] : <Asset>[];
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromDto = currentAsset.id == Isar.autoIncrement;
    final album = ref.watch(currentAlbumProvider);

    Asset asset() => stackIndex.value == -1
        ? currentAsset
        : stackElements.elementAt(stackIndex.value);
    final isOwner = asset().ownerId == ref.watch(currentUserProvider)?.isarId;
    final isPartner = ref
        .watch(partnerSharedWithProvider)
        .map((e) => e.isarId)
        .contains(asset().ownerId);

    bool isParent = stackIndex.value == -1 || stackIndex.value == 0;

    // Listen provider to prevent autoDispose when navigating to other routes from within the gallery page
    ref.listen(currentAssetProvider, (_, __) {});
    useEffect(
      () {
        // Delay state update to after the execution of build method
        Future.microtask(
          () => ref.read(currentAssetProvider.notifier).set(asset()),
        );
        return null;
      },
      [asset()],
    );

    useEffect(
      () {
        isLoadPreview.value =
            settings.getSetting<bool>(AppSettingsEnum.loadPreview);
        isLoadOriginal.value =
            settings.getSetting<bool>(AppSettingsEnum.loadOriginal);
        isPlayingMotionVideo.value = false;
        return null;
      },
      [],
    );

    void toggleFavorite(Asset asset) =>
        ref.read(assetProvider.notifier).toggleFavorite([asset]);

    /// Original (large) image of a remote asset. Required asset.isRemote
    ImageProvider remoteOriginalProvider(Asset asset) =>
        CachedNetworkImageProvider(
          getImageUrl(asset),
          cacheKey: getImageCacheKey(asset),
          headers: header,
        );

    /// Original (large) image of a local asset. Required asset.isLocal
    ImageProvider localOriginalProvider(Asset asset) =>
        OriginalImageProvider(asset);

    ImageProvider finalImageProvider(Asset asset) {
      if (ImmichImage.useLocal(asset)) {
        return localOriginalProvider(asset);
      } else if (isLoadOriginal.value) {
        return remoteOriginalProvider(asset);
      } else if (isLoadPreview.value) {
        return ImmichImage.remoteThumbnailProvider(asset, jpeg, header);
      }
      return ImmichImage.remoteThumbnailProvider(asset, webp, header);
    }

    Iterable<ImageProvider> allImageProviders(Asset asset) sync* {
      if (ImmichImage.useLocal(asset)) {
        yield ImmichImage.localImageProvider(asset);
        yield localOriginalProvider(asset);
      } else {
        yield ImmichImage.remoteThumbnailProvider(asset, webp, header);
        if (isLoadPreview.value) {
          yield ImmichImage.remoteThumbnailProvider(asset, jpeg, header);
        }
        if (isLoadOriginal.value) {
          yield remoteOriginalProvider(asset);
        }
      }
    }

    void precacheNextImage(int index) {
      void onError(Object exception, StackTrace? stackTrace) {
        // swallow error silently
      }
      if (index < totalAssets && index >= 0) {
        final asset = loadAsset(index);
        for (final imageProvider in allImageProviders(asset)) {
          precacheImage(imageProvider, context, onError: onError);
        }
      }
    }

    void showInfo() {
      showModalBottomSheet(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(15.0)),
        ),
        barrierColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        useSafeArea: true,
        context: context,
        builder: (context) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.viewInsetsOf(context).bottom,
            ),
            child: ref
                    .watch(appSettingsServiceProvider)
                    .getSetting<bool>(AppSettingsEnum.advancedTroubleshooting)
                ? AdvancedBottomSheet(assetDetail: asset())
                : ExifBottomSheet(asset: asset()),
          );
        },
      );
    }

    void removeAssetFromStack() {
      if (stackIndex.value > 0 && showStack) {
        ref
            .read(assetStackStateProvider(currentAsset).notifier)
            .removeChild(stackIndex.value - 1);
        stackIndex.value = stackIndex.value - 1;
      }
    }

    void handleDelete(Asset deleteAsset) async {
      // Cannot delete readOnly / external assets. They are handled through library offline jobs
      if (asset().isReadOnly) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_delete_err_read_only'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }
      Future<bool> onDelete(bool force) async {
        final isDeleted = await ref.read(assetProvider.notifier).deleteAssets(
          {deleteAsset},
          force: force,
        );
        if (isDeleted && isParent) {
          if (totalAssets == 1) {
            // Handle only one asset
            context.popRoute();
          } else {
            // Go to next page otherwise
            controller.nextPage(
              duration: const Duration(milliseconds: 100),
              curve: Curves.fastLinearToSlowEaseIn,
            );
          }
        }
        return isDeleted;
      }

      // Asset is trashed
      if (isTrashEnabled && !isFromTrash) {
        final isDeleted = await onDelete(false);
        if (isDeleted) {
          // Can only trash assets stored in server. Local assets are always permanently removed for now
          if (context.mounted && deleteAsset.isRemote && isParent) {
            ImmichToast.show(
              durationInSecond: 1,
              context: context,
              msg: 'Asset trashed',
              gravity: ToastGravity.BOTTOM,
            );
          }
          removeAssetFromStack();
        }
        return;
      }

      // Asset is permanently removed
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return DeleteDialog(
            onDelete: () async {
              final isDeleted = await onDelete(true);
              if (isDeleted) {
                removeAssetFromStack();
              }
            },
          );
        },
      );
    }

    void addToAlbum(Asset addToAlbumAsset) {
      showModalBottomSheet(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15.0),
        ),
        context: context,
        builder: (BuildContext _) {
          return AddToAlbumBottomSheet(
            assets: [addToAlbumAsset],
          );
        },
      );
    }

    void handleSwipeUpDown(DragUpdateDetails details) {
      int sensitivity = 15;
      int dxThreshold = 50;
      double ratioThreshold = 3.0;

      if (isZoomed.value) {
        return;
      }

      // Guard [localPosition] null
      if (localPosition == null) {
        return;
      }

      // Check for delta from initial down point
      final d = details.localPosition - localPosition!;
      // If the magnitude of the dx swipe is large, we probably didn't mean to go down
      if (d.dx.abs() > dxThreshold) {
        return;
      }

      final ratio = d.dy / max(d.dx.abs(), 1);
      if (d.dy > sensitivity && ratio > ratioThreshold) {
        context.popRoute();
      } else if (d.dy < -sensitivity && ratio < -ratioThreshold) {
        showInfo();
      }
    }

    shareAsset() {
      if (asset().isOffline) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_share_err_offline'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }
      ref.read(imageViewerStateProvider.notifier).shareAsset(asset(), context);
    }

    handleArchive(Asset asset) {
      ref.read(assetProvider.notifier).toggleArchive([asset]);
      if (isParent) {
        context.popRoute();
        return;
      }
      removeAssetFromStack();
    }

    handleUpload(Asset asset) {
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return UploadDialog(
            onUpload: () {
              ref
                  .read(manualUploadProvider.notifier)
                  .uploadAssets(context, [asset]);
            },
          );
        },
      );
    }

    handleDownload() {
      if (asset().isLocal) {
        return;
      }
      if (asset().isOffline) {
        ImmichToast.show(
          durationInSecond: 1,
          context: context,
          msg: 'asset_action_share_err_offline'.tr(),
          gravity: ToastGravity.BOTTOM,
        );
        return;
      }

      ref.read(imageViewerStateProvider.notifier).downloadAsset(
            asset(),
            context,
          );
    }

    handleActivities() {
      if (album != null && album.shared && album.remoteId != null) {
        context.pushRoute(const ActivitiesRoute());
      }
    }

    buildAppBar() {
      return IgnorePointer(
        ignoring: !ref.watch(showControlsProvider),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 100),
          opacity: ref.watch(showControlsProvider) ? 1.0 : 0.0,
          child: Container(
            color: Colors.black.withOpacity(0.4),
            child: TopControlAppBar(
              isOwner: isOwner,
              isPartner: isPartner,
              isPlayingMotionVideo: isPlayingMotionVideo.value,
              asset: asset(),
              onMoreInfoPressed: showInfo,
              onFavorite: toggleFavorite,
              onUploadPressed:
                  asset().isLocal ? () => handleUpload(asset()) : null,
              onDownloadPressed: asset().isLocal
                  ? null
                  : () =>
                      ref.read(imageViewerStateProvider.notifier).downloadAsset(
                            asset(),
                            context,
                          ),
              onToggleMotionVideo: (() {
                isPlayingMotionVideo.value = !isPlayingMotionVideo.value;
              }),
              onAddToAlbumPressed: () => addToAlbum(asset()),
              onActivitiesPressed: handleActivities,
            ),
          ),
        ),
      );
    }

    Widget buildProgressBar() {
      final playerValue = ref.watch(videoPlaybackValueProvider);

      return Expanded(
        child: Slider(
          value: playerValue.duration == Duration.zero
              ? 0.0
              : min(
                  playerValue.position.inMicroseconds /
                      playerValue.duration.inMicroseconds *
                      100,
                  100,
                ),
          min: 0,
          max: 100,
          thumbColor: Colors.white,
          activeColor: Colors.white,
          inactiveColor: Colors.white.withOpacity(0.75),
          onChanged: (position) {
            ref.read(videoPlayerControlsProvider.notifier).position = position;
          },
        ),
      );
    }

    Text buildPosition() {
      final position = ref
          .watch(videoPlaybackValueProvider.select((value) => value.position));

      return Text(
        _formatDuration(position),
        style: TextStyle(
          fontSize: 14.0,
          color: Colors.white.withOpacity(.75),
          fontWeight: FontWeight.normal,
        ),
      );
    }

    Text buildDuration() {
      final duration = ref
          .watch(videoPlaybackValueProvider.select((value) => value.duration));

      return Text(
        _formatDuration(duration),
        style: TextStyle(
          fontSize: 14.0,
          color: Colors.white.withOpacity(.75),
          fontWeight: FontWeight.normal,
        ),
      );
    }

    Widget buildMuteButton() {
      return IconButton(
        icon: Icon(
          ref.watch(videoPlayerControlsProvider.select((value) => value.mute))
              ? Icons.volume_off
              : Icons.volume_up,
        ),
        onPressed: () =>
            ref.read(videoPlayerControlsProvider.notifier).toggleMute(),
        color: Colors.white,
      );
    }

    Widget buildStackedChildren() {
      return ListView.builder(
        shrinkWrap: true,
        scrollDirection: Axis.horizontal,
        itemCount: stackElements.length,
        itemBuilder: (context, index) {
          final assetId = stackElements.elementAt(index).remoteId;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => stackIndex.value = index,
              child: Container(
                width: 40,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: (stackIndex.value == -1 && index == 0) ||
                          index == stackIndex.value
                      ? Border.all(
                          color: Colors.white,
                          width: 2,
                        )
                      : null,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: CachedNetworkImage(
                    fit: BoxFit.cover,
                    imageUrl:
                        '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/$assetId',
                    httpHeaders: {
                      "x-immich-user-token": Store.get(StoreKey.accessToken),
                    },
                    errorWidget: (context, url, error) =>
                        const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    void showStackActionItems() {
      showModalBottomSheet<void>(
        context: context,
        enableDrag: false,
        builder: (BuildContext ctx) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isParent)
                    ListTile(
                      leading: const Icon(
                        Icons.bookmark_border_outlined,
                        size: 24,
                      ),
                      onTap: () async {
                        await ref
                            .read(assetStackServiceProvider)
                            .updateStackParent(
                              currentAsset,
                              stackElements.elementAt(stackIndex.value),
                            );
                        ctx.pop();
                        context.popRoute();
                      },
                      title: const Text(
                        "viewer_stack_use_as_main_asset",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ).tr(),
                    ),
                  ListTile(
                    leading: const Icon(
                      Icons.copy_all_outlined,
                      size: 24,
                    ),
                    onTap: () async {
                      if (isParent) {
                        await ref
                            .read(assetStackServiceProvider)
                            .updateStackParent(
                              currentAsset,
                              stackElements
                                  .elementAt(1), // Next asset as parent
                            );
                        // Remove itself from stack
                        await ref.read(assetStackServiceProvider).updateStack(
                          stackElements.elementAt(1),
                          childrenToRemove: [currentAsset],
                        );
                        ctx.pop();
                        context.popRoute();
                      } else {
                        await ref.read(assetStackServiceProvider).updateStack(
                          currentAsset,
                          childrenToRemove: [
                            stackElements.elementAt(stackIndex.value),
                          ],
                        );
                        removeAssetFromStack();
                        ctx.pop();
                      }
                    },
                    title: const Text(
                      "viewer_remove_from_stack",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ).tr(),
                  ),
                  ListTile(
                    leading: const Icon(
                      Icons.filter_none_outlined,
                      size: 18,
                    ),
                    onTap: () async {
                      await ref.read(assetStackServiceProvider).updateStack(
                            currentAsset,
                            childrenToRemove: stack,
                          );
                      ctx.pop();
                      context.popRoute();
                    },
                    title: const Text(
                      "viewer_unstack",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ).tr(),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    // TODO: Migrate to a custom bottom bar and handle long press to delete
    Widget buildBottomBar() {
      // !!!! itemsList and actionlist should always be in sync
      final itemsList = [
        BottomNavigationBarItem(
          icon: Icon(
            Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
          ),
          label: 'control_bottom_app_bar_share'.tr(),
          tooltip: 'control_bottom_app_bar_share'.tr(),
        ),
        if (isOwner)
          asset().isArchived
              ? BottomNavigationBarItem(
                  icon: const Icon(Icons.unarchive_rounded),
                  label: 'control_bottom_app_bar_unarchive'.tr(),
                  tooltip: 'control_bottom_app_bar_unarchive'.tr(),
                )
              : BottomNavigationBarItem(
                  icon: const Icon(Icons.archive_outlined),
                  label: 'control_bottom_app_bar_archive'.tr(),
                  tooltip: 'control_bottom_app_bar_archive'.tr(),
                ),
        if (isOwner && stack.isNotEmpty)
          BottomNavigationBarItem(
            icon: const Icon(Icons.burst_mode_outlined),
            label: 'control_bottom_app_bar_stack'.tr(),
            tooltip: 'control_bottom_app_bar_stack'.tr(),
          ),
        if (isOwner)
          BottomNavigationBarItem(
            icon: const Icon(Icons.delete_outline),
            label: 'control_bottom_app_bar_delete'.tr(),
            tooltip: 'control_bottom_app_bar_delete'.tr(),
          ),
        if (!isOwner)
          BottomNavigationBarItem(
            icon: const Icon(Icons.download_outlined),
            label: 'download'.tr(),
            tooltip: 'download'.tr(),
          ),
      ];

      List<Function(int)> actionslist = [
        (_) => shareAsset(),
        if (isOwner) (_) => handleArchive(asset()),
        if (isOwner && stack.isNotEmpty) (_) => showStackActionItems(),
        if (isOwner) (_) => handleDelete(asset()),
        if (!isOwner) (_) => handleDownload(),
      ];

      return IgnorePointer(
        ignoring: !ref.watch(showControlsProvider),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 100),
          opacity: ref.watch(showControlsProvider) ? 1.0 : 0.0,
          child: Column(
            children: [
              if (stack.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(
                    left: 10,
                    bottom: 30,
                  ),
                  child: SizedBox(
                    height: 40,
                    child: buildStackedChildren(),
                  ),
                ),
              Visibility(
                visible: !asset().isImage && !isPlayingMotionVideo.value,
                child: Container(
                  color: Colors.black.withOpacity(0.4),
                  child: Padding(
                    padding: MediaQuery.of(context).orientation ==
                            Orientation.portrait
                        ? const EdgeInsets.symmetric(horizontal: 12.0)
                        : const EdgeInsets.symmetric(horizontal: 64.0),
                    child: Row(
                      children: [
                        buildPosition(),
                        buildProgressBar(),
                        buildDuration(),
                        buildMuteButton(),
                      ],
                    ),
                  ),
                ),
              ),
              BottomNavigationBar(
                backgroundColor: Colors.black.withOpacity(0.4),
                unselectedIconTheme: const IconThemeData(color: Colors.white),
                selectedIconTheme: const IconThemeData(color: Colors.white),
                unselectedLabelStyle: const TextStyle(color: Colors.black),
                selectedLabelStyle: const TextStyle(color: Colors.black),
                showSelectedLabels: false,
                showUnselectedLabels: false,
                items: itemsList,
                onTap: (index) {
                  if (index < actionslist.length) {
                    actionslist[index].call(index);
                  }
                },
              ),
            ],
          ),
        ),
      );
    }

    ref.listen(showControlsProvider, (_, show) {
      if (show) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      } else {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      }
    });

    return PopScope(
      canPop: false,
      onPopInvoked: (_) {
        // Change immersive mode back to normal "edgeToEdge" mode
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        context.pop();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PhotoViewGallery.builder(
              scaleStateChangedCallback: (state) {
                isZoomed.value = state != PhotoViewScaleState.initial;
                ref.read(showControlsProvider.notifier).show = !isZoomed.value;
              },
              pageController: controller,
              scrollPhysics: isZoomed.value
                  ? const NeverScrollableScrollPhysics() // Don't allow paging while scrolled in
                  : (Platform.isIOS
                      ? const ScrollPhysics() // Use bouncing physics for iOS
                      : const ClampingScrollPhysics() // Use heavy physics for Android
                  ),
              itemCount: totalAssets,
              scrollDirection: Axis.horizontal,
              onPageChanged: (value) {
                final next = currentIndex.value < value ? value + 1 : value - 1;
                precacheNextImage(next);
                currentIndex.value = value;
                stackIndex.value = -1;
                HapticFeedback.selectionClick();
              },
              loadingBuilder: (context, event, index) {
                final a = loadAsset(index);
                if (ImmichImage.useLocal(a)) {
                  return Image(
                    image: ImmichImage.localImageProvider(a),
                    fit: BoxFit.contain,
                  );
                }
                // Use the WEBP Thumbnail as a placeholder for the JPEG thumbnail to achieve
                // Three-Stage Loading (WEBP -> JPEG -> Original)
                final webPThumbnail = CachedNetworkImage(
                  imageUrl: getThumbnailUrl(a, type: webp),
                  cacheKey: getThumbnailCacheKey(a, type: webp),
                  httpHeaders: header,
                  progressIndicatorBuilder: (_, __, ___) => const Center(
                    child: ImmichLoadingIndicator(),
                  ),
                  fadeInDuration: const Duration(milliseconds: 0),
                  fit: BoxFit.contain,
                  errorWidget: (context, url, error) =>
                      const Icon(Icons.image_not_supported_outlined),
                );

                // loading the preview in the loadingBuilder only
                // makes sense if the original is loaded in the builder
                return isLoadPreview.value && isLoadOriginal.value
                    ? CachedNetworkImage(
                        imageUrl: getThumbnailUrl(a, type: jpeg),
                        cacheKey: getThumbnailCacheKey(a, type: jpeg),
                        httpHeaders: header,
                        fit: BoxFit.contain,
                        fadeInDuration: const Duration(milliseconds: 0),
                        placeholder: (_, __) => webPThumbnail,
                        errorWidget: (_, __, ___) => webPThumbnail,
                      )
                    : webPThumbnail;
              },
              builder: (context, index) {
                final a =
                    index == currentIndex.value ? asset() : loadAsset(index);
                final ImageProvider provider = finalImageProvider(a);

                if (a.isImage && !isPlayingMotionVideo.value) {
                  return PhotoViewGalleryPageOptions(
                    onDragStart: (_, details, __) =>
                        localPosition = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    onTapDown: (_, __, ___) {
                      ref.read(showControlsProvider.notifier).toggle();
                    },
                    imageProvider: provider,
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: isFromDto
                          ? '${currentAsset.remoteId}-$heroOffset'
                          : currentAsset.id + heroOffset,
                      transitionOnUserGestures: true,
                    ),
                    filterQuality: FilterQuality.high,
                    tightMode: true,
                    minScale: PhotoViewComputedScale.contained,
                    errorBuilder: (context, error, stackTrace) => ImmichImage(
                      a,
                      fit: BoxFit.contain,
                    ),
                  );
                } else {
                  return PhotoViewGalleryPageOptions.customChild(
                    onDragStart: (_, details, __) =>
                        localPosition = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: isFromDto
                          ? '${currentAsset.remoteId}-$heroOffset'
                          : currentAsset.id + heroOffset,
                    ),
                    filterQuality: FilterQuality.high,
                    maxScale: 1.0,
                    minScale: 1.0,
                    basePosition: Alignment.center,
                    child: VideoViewerPage(
                      onPlaying: () => isPlayingVideo.value = true,
                      onPaused: () =>
                          WidgetsBinding.instance.addPostFrameCallback(
                        (_) => isPlayingVideo.value = false,
                      ),
                      asset: a,
                      isMotionVideo: isPlayingMotionVideo.value,
                      placeholder: Image(
                        image: provider,
                        fit: BoxFit.fitWidth,
                        height: context.height,
                        width: context.width,
                        alignment: Alignment.center,
                      ),
                      onVideoEnded: () {
                        if (isPlayingMotionVideo.value) {
                          isPlayingMotionVideo.value = false;
                        }
                      },
                    ),
                  );
                }
              },
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: buildAppBar(),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: buildBottomBar(),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(Duration position) {
    final ms = position.inMilliseconds;

    int seconds = ms ~/ 1000;
    final int hours = seconds ~/ 3600;
    seconds = seconds % 3600;
    final minutes = seconds ~/ 60;
    seconds = seconds % 60;

    final hoursString = hours >= 10
        ? '$hours'
        : hours == 0
            ? '00'
            : '0$hours';

    final minutesString = minutes >= 10
        ? '$minutes'
        : minutes == 0
            ? '00'
            : '0$minutes';

    final secondsString = seconds >= 10
        ? '$seconds'
        : seconds == 0
            ? '00'
            : '0$seconds';

    final formattedTime =
        '${hoursString == '00' ? '' : '$hoursString:'}$minutesString:$secondsString';

    return formattedTime;
  }
}
