import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/albums/asset_selection_page_result.model.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_title.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_action_outlined_button.dart';
import 'package:immich_mobile/widgets/album/album_title_text_field.dart';
import 'package:immich_mobile/widgets/album/shared_album_thumbnail_image.dart';

@RoutePage()
// ignore: must_be_immutable
class CreateAlbumPage extends HookConsumerWidget {
  final bool isSharedAlbum;
  final List<Asset>? initialAssets;

  const CreateAlbumPage({
    super.key,
    required this.isSharedAlbum,
    this.initialAssets,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);
    final selectedAssets = useState<Set<Asset>>(
      initialAssets != null ? Set.from(initialAssets!) : const {},
    );

    showSelectUserPage() async {
      final bool? ok = await context.pushRoute<bool?>(
        AlbumSharedUserSelectionRoute(assets: selectedAssets.value),
      );
      if (ok == true) {
        selectedAssets.value = {};
      }
    }

    void onBackgroundTapped() {
      albumTitleTextFieldFocusNode.unfocus();
      isAlbumTitleTextFieldFocus.value = false;

      if (albumTitleController.text.isEmpty) {
        albumTitleController.text = 'create_album_page_untitled'.tr();
        ref
            .watch(albumTitleProvider.notifier)
            .setAlbumTitle('create_album_page_untitled'.tr());
      }
    }

    onSelectPhotosButtonPressed() async {
      AssetSelectionPageResult? selectedAsset =
          await context.pushRoute<AssetSelectionPageResult?>(
        AlbumAssetSelectionRoute(
          existingAssets: selectedAssets.value,
          canDeselect: true,
          query: getRemoteAssetQuery(ref),
        ),
      );
      if (selectedAsset == null) {
        selectedAssets.value = const {};
      } else {
        selectedAssets.value = selectedAsset.selectedAssets;
      }
    }

    buildTitleInputField() {
      return Padding(
        padding: const EdgeInsets.only(
          right: 10,
          left: 10,
        ),
        child: AlbumTitleTextField(
          isAlbumTitleEmpty: isAlbumTitleEmpty,
          albumTitleTextFieldFocusNode: albumTitleTextFieldFocusNode,
          albumTitleController: albumTitleController,
          isAlbumTitleTextFieldFocus: isAlbumTitleTextFieldFocus,
        ),
      );
    }

    buildTitle() {
      if (selectedAssets.value.isEmpty) {
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 200, left: 18),
            child: Text(
              'create_shared_album_page_share_add_assets',
              style: context.textTheme.labelLarge,
            ).tr(),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    buildSelectPhotosButton() {
      if (selectedAssets.value.isEmpty) {
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 16, left: 18, right: 18),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                alignment: Alignment.centerLeft,
                padding:
                    const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                side: BorderSide(
                  color: context.isDarkTheme
                      ? const Color.fromARGB(255, 63, 63, 63)
                      : const Color.fromARGB(255, 129, 129, 129),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              onPressed: onSelectPhotosButtonPressed,
              icon: Icon(
                Icons.add_rounded,
                color: context.primaryColor,
              ),
              label: Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  'create_shared_album_page_share_select_photos',
                  style: context.textTheme.titleMedium?.copyWith(
                    color: context.primaryColor,
                  ),
                ).tr(),
              ),
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    buildControlButton() {
      return Padding(
        padding: const EdgeInsets.only(left: 12.0, top: 16, bottom: 16),
        child: SizedBox(
          height: 30,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              AlbumActionOutlinedButton(
                iconData: Icons.add_photo_alternate_outlined,
                onPressed: onSelectPhotosButtonPressed,
                labelText: "share_add_photos".tr(),
              ),
            ],
          ),
        ),
      );
    }

    buildSelectedImageGrid() {
      if (selectedAssets.value.isNotEmpty) {
        return SliverPadding(
          padding: const EdgeInsets.only(top: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 5.0,
              mainAxisSpacing: 5,
            ),
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return GestureDetector(
                  onTap: onBackgroundTapped,
                  child: SharedAlbumThumbnailImage(
                    asset: selectedAssets.value.elementAt(index),
                  ),
                );
              },
              childCount: selectedAssets.value.length,
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    createNonSharedAlbum() async {
      var newAlbum = await ref.watch(albumProvider.notifier).createAlbum(
            ref.watch(albumTitleProvider),
            selectedAssets.value,
          );

      if (newAlbum != null) {
        ref.watch(albumProvider.notifier).getAllAlbums();
        selectedAssets.value = {};
        ref.watch(albumTitleProvider.notifier).clearAlbumTitle();

        context.replaceRoute(AlbumViewerRoute(albumId: newAlbum.id));
      }
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: false,
        backgroundColor: context.scaffoldBackgroundColor,
        leading: IconButton(
          onPressed: () {
            selectedAssets.value = {};
            context.maybePop();
          },
          icon: const Icon(Icons.close_rounded),
        ),
        title: const Text(
          'share_create_album',
        ).tr(),
        actions: [
          if (isSharedAlbum)
            TextButton(
              onPressed: albumTitleController.text.isNotEmpty
                  ? showSelectUserPage
                  : null,
              child: Text(
                'create_shared_album_page_share'.tr(),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: albumTitleController.text.isEmpty
                      ? context.themeData.disabledColor
                      : context.primaryColor,
                ),
              ),
            ),
          if (!isSharedAlbum)
            TextButton(
              onPressed: albumTitleController.text.isNotEmpty &&
                      selectedAssets.value.isNotEmpty
                  ? createNonSharedAlbum
                  : null,
              child: Text(
                'create_shared_album_page_create'.tr(),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ),
            ),
        ],
      ),
      body: GestureDetector(
        onTap: onBackgroundTapped,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              backgroundColor: context.scaffoldBackgroundColor,
              elevation: 5,
              automaticallyImplyLeading: false,
              pinned: true,
              floating: false,
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(66.0),
                child: Column(
                  children: [
                    buildTitleInputField(),
                    if (selectedAssets.value.isNotEmpty) buildControlButton(),
                  ],
                ),
              ),
            ),
            buildTitle(),
            buildSelectPhotosButton(),
            buildSelectedImageGrid(),
          ],
        ),
      ),
    );
  }
}
