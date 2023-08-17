import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/album_title.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/album/ui/album_title_text_field.dart';
import 'package:immich_mobile/modules/album/ui/shared_album_thumbnail_image.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';

// ignore: must_be_immutable
class CreateAlbumPage extends HookConsumerWidget {
  final bool isSharedAlbum;
  final List<Asset>? initialAssets;

  const CreateAlbumPage({
    Key? key,
    required this.isSharedAlbum,
    this.initialAssets,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);
    final selectedAssets = useState<Set<Asset>>(
        initialAssets != null ? Set.from(initialAssets!) : const {},);
    final isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    showSelectUserPage() async {
      final bool? ok = await AutoRouter.of(context)
          .push<bool?>(SelectUserForSharingRoute(assets: selectedAssets.value));
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
          await AutoRouter.of(context).push<AssetSelectionPageResult?>(
        AssetSelectionRoute(
          existingAssets: selectedAssets.value,
          isNewAlbum: true,
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
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                  ),
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
                  color: isDarkTheme
                      ? const Color.fromARGB(255, 63, 63, 63)
                      : const Color.fromARGB(255, 206, 206, 206),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              onPressed: onSelectPhotosButtonPressed,
              icon: Icon(
                Icons.add_rounded,
                color: Theme.of(context).primaryColor,
              ),
              label: Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  'create_shared_album_page_share_select_photos',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
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

        AutoRouter.of(context).replace(AlbumViewerRoute(albumId: newAlbum.id));
      }
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        leading: IconButton(
          onPressed: () {
            selectedAssets.value = {};
            AutoRouter.of(context).pop();
          },
          icon: const Icon(Icons.close_rounded),
        ),
        title: Text(
          'share_create_album',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: Theme.of(context).primaryColor,
              ),
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
                      ? Theme.of(context).disabledColor
                      : Theme.of(context).primaryColor,
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
                  color: Theme.of(context).primaryColor,
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
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
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
