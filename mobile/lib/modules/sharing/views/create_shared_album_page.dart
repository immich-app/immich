import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/asset_selection_page_result.model.dart';
import 'package:immich_mobile/modules/sharing/providers/album_title.provider.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/sharing/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/sharing/ui/album_title_text_field.dart';
import 'package:immich_mobile/modules/sharing/ui/shared_album_thumbnail_image.dart';
import 'package:immich_mobile/routing/router.dart';

class CreateSharedAlbumPage extends HookConsumerWidget {
  const CreateSharedAlbumPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController = useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);
    final selectedAssets = ref.watch(assetSelectionProvider).selectedNewAssetsForAlbum;

    _showSelectUserPage() {
      AutoRouter.of(context).push(const SelectUserForSharingRoute());
    }

    void _onBackgroundTapped() {
      albumTitleTextFieldFocusNode.unfocus();
      isAlbumTitleTextFieldFocus.value = false;

      if (albumTitleController.text.isEmpty) {
        albumTitleController.text = 'Untitled';
        ref.watch(albumTitleProvider.notifier).setAlbumTitle('Untitled');
      }
    }

    _onSelectPhotosButtonPressed() async {
      ref.watch(assetSelectionProvider.notifier).setIsAlbumExist(false);

      AssetSelectionPageResult? selectedAsset =
          await AutoRouter.of(context).push<AssetSelectionPageResult?>(const AssetSelectionRoute());

      if (selectedAsset == null) {
        ref.watch(assetSelectionProvider.notifier).removeAll();
      }
    }

    _buildTitleInputField() {
      return Padding(
        padding: const EdgeInsets.only(
          right: 10,
          left: 10,
        ),
        child: AlbumTitleTextField(
            isAlbumTitleEmpty: isAlbumTitleEmpty,
            albumTitleTextFieldFocusNode: albumTitleTextFieldFocusNode,
            albumTitleController: albumTitleController,
            isAlbumTitleTextFieldFocus: isAlbumTitleTextFieldFocus),
      );
    }

    _buildTitle() {
      if (selectedAssets.isEmpty) {
        return const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.only(top: 200, left: 18),
            child: Text(
              'ADD ASSETS',
              style: TextStyle(fontSize: 12),
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    _buildSelectPhotosButton() {
      if (selectedAssets.isEmpty) {
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 16, left: 18, right: 18),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                  side: const BorderSide(color: Color.fromARGB(255, 206, 206, 206)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5))),
              onPressed: _onSelectPhotosButtonPressed,
              icon: const Icon(Icons.add_rounded),
              label: Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: Text(
                  'Select Photos',
                  style: TextStyle(fontSize: 16, color: Colors.grey[700], fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    _buildControlButton() {
      if (selectedAssets.isNotEmpty) {
        return Padding(
          padding: const EdgeInsets.only(left: 12.0, top: 16, bottom: 16),
          child: SizedBox(
            height: 30,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                AlbumActionOutlinedButton(
                  iconData: Icons.add_photo_alternate_outlined,
                  onPressed: _onSelectPhotosButtonPressed,
                  labelText: "Add photos",
                ),
              ],
            ),
          ),
        );
      }

      return Container();
    }

    _buildSelectedImageGrid() {
      if (selectedAssets.isNotEmpty) {
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
                  onTap: _onBackgroundTapped,
                  child: SharedAlbumThumbnailImage(asset: selectedAssets.toList()[index]),
                );
              },
              childCount: selectedAssets.length,
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          centerTitle: false,
          leading: IconButton(
              onPressed: () {
                ref.watch(assetSelectionProvider.notifier).removeAll();
                AutoRouter.of(context).pop();
              },
              icon: const Icon(Icons.close_rounded)),
          title: const Text(
            'Create album',
            style: TextStyle(color: Colors.black),
          ),
          actions: [
            TextButton(
              onPressed: albumTitleController.text.isNotEmpty ? _showSelectUserPage : null,
              child: const Text(
                'Share',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        body: GestureDetector(
          onTap: _onBackgroundTapped,
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                elevation: 5,
                leading: Container(),
                pinned: true,
                floating: false,
                bottom: PreferredSize(
                  child: Column(
                    children: [
                      _buildTitleInputField(),
                      _buildControlButton(),
                    ],
                  ),
                  preferredSize: const Size.fromHeight(66.0),
                ),
              ),
              _buildTitle(),
              _buildSelectPhotosButton(),
              _buildSelectedImageGrid(),
            ],
          ),
        ));
  }
}
